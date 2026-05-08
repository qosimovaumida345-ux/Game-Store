const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');

const execPromise = util.promisify(exec);

// User's credentials injected into the script securely (Render ENV or static)
const UNITY_EMAIL = process.env.UNITY_EMAIL || 'qosimovaumida345@gmail.com';
const UNITY_PASSWORD = process.env.UNITY_PASSWORD || 'Abdulloh2011/';

async function buildUnityGame(gameId, csharpCode) {
    const baseProjectDir = path.resolve(__dirname, '../UnityBaseProject');
    const targetProjectDir = path.resolve(__dirname, `../.tmp/builds/${gameId}`);
    
    console.log(`[UnityBuilder] Preparing Docker Build Environment for Game: ${gameId}`);

    // Create temp workspace for this new game
    if (fs.existsSync(targetProjectDir)) {
        fs.rmSync(targetProjectDir, { recursive: true, force: true });
    }
    fs.mkdirSync(path.join(targetProjectDir, 'Assets/Scripts'), { recursive: true });
    
    // Copy the Editor script
    fs.cpSync(
        path.join(baseProjectDir, 'Assets/Editor'),
        path.join(targetProjectDir, 'Assets/Editor'),
        { recursive: true }
    );

    // Save the C# script requested by the player/generation
    const scriptPath = path.join(targetProjectDir, 'Assets/Scripts/GameCode.cs');
    fs.writeFileSync(scriptPath, csharpCode);
    console.log(`[UnityBuilder] Scaffolding complete. Injected C# into ${scriptPath}`);

    // Initialize required Unity folders to prevent errors
    fs.mkdirSync(path.join(targetProjectDir, 'ProjectSettings'), { recursive: true });

    console.log(`[UnityBuilder] Evaluating Execution Context...`);
    
    // Tizim Render ichidagi Dockerfile da ishlayaptimi yoxud shaxsiy kompyuterda ekanligini aniqlaymiz.
    // Dockerfile muhitida 'docker' degan komanda chiqmaydi, uning o'zini ichida 'Unity' (unity-editor) o'rnatilgan bo'ladi!
    const isNativeLinuxUnity = process.env.RENDER || fs.existsSync('/opt/unity') || !fs.existsSync('C:\\');
    
    let engineCmd;
    
    if (isNativeLinuxUnity) {
        // RENDER / YANGO DOCKERFILE MUHITI! (To'g'ridan-to'g'ri Unity'ga yuzlanamiz)
        engineCmd = `unity-editor -quit -batchmode -nographics \
        -username "${UNITY_EMAIL}" \
        -password "${UNITY_PASSWORD}" \
        -projectPath "${targetProjectDir}" \
        -executeMethod WebGLBuilder.Build \
        -buildTarget WebGL`;
    } else {
        // WINDOWS KOMPYUTERI DOCKER DESKTOP ORQALI ISHLASHA:
        engineCmd = `docker run --rm \
            -v "${targetProjectDir.replace(/\\/g, '/')}:/project" \
            unityci/editor:ubuntu-2022.3.16f1-webgl-3 \
            Unity -quit -batchmode -nographics \
            -username "${UNITY_EMAIL}" \
            -password "${UNITY_PASSWORD}" \
            -projectPath /project \
            -executeMethod WebGLBuilder.Build \
            -buildTarget WebGL`;
    }

    try {
        console.log(`[UnityBuilder] Executing Engine CLI (This may take a few minutes)...`);
        
        // Execute the build command (Timeout 10 minutes)
        const { stdout, stderr } = await execPromise(engineCmd, { timeout: 600000 });
        
        console.log(`[UnityBuilder] Build Finished successfully!`);
        
        // Output from unity is in Builds/WebGL. Map this to the public folder!
        const buildOutput = path.join(targetProjectDir, 'Builds/WebGL');
        const publicGamesDir = path.resolve(__dirname, `../public/games/${gameId}`);
        
        if (fs.existsSync(publicGamesDir)) {
            fs.rmSync(publicGamesDir, { recursive: true, force: true });
        }
        
        // Move the compiled WebGL artifacts securely mapped to our platform
        if (fs.existsSync(buildOutput)) {
            fs.renameSync(buildOutput, publicGamesDir);
            console.log(`[UnityBuilder] MOUNTED WebGL Build to /games/${gameId}`);
            return { success: true, url: `/games/${gameId}/index.html` };
        } else {
            throw new Error('Build directory missing. Docker build failed or no scene found.');
        }

    } catch (err) {
        console.error(`[UnityBuilder] WebGL Build ERROR:`, err.message);
        
        // Provide log dump if possible
        const logPath = path.join(targetProjectDir, 'Editor.log');
        if (fs.existsSync(logPath)) {
             console.error(`[UnityBuilder] Extracted Editor.log snippet:`, fs.readFileSync(logPath, 'utf8').slice(-500));
        }

        return { success: false, error: err.message };
    }
}

module.exports = { buildUnityGame };
