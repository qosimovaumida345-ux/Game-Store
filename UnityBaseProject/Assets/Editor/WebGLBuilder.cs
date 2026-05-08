using UnityEditor;
using System.Linq;

public class WebGLBuilder
{
    public static void Build()
    {
        // Get all active scenes in settings (if any exist), else create a default blank one or pack everything 
        EditorBuildSettingsScene[] scenes = EditorBuildSettings.scenes;
        string[] scenePaths = scenes.Where(s => s.enabled).Select(s => s.path).ToArray();

        // If no scenes are configured, just build all scenes found in Assets
        if (scenePaths.Length == 0)
        {
            string[] allScenes = AssetDatabase.FindAssets("t:Scene");
            scenePaths = allScenes.Select(guid => AssetDatabase.GUIDToAssetPath(guid)).ToArray();
        }

        BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
        {
            scenes = scenePaths,
            locationPathName = "Builds/WebGL",
            target = BuildTarget.WebGL,
            options = BuildOptions.None
        };

        // Suppress dialogs for headless build
        var report = BuildPipeline.BuildPlayer(buildPlayerOptions);
        
        if (report.summary.result == UnityEditor.Build.Reporting.BuildResult.Succeeded)
        {
            System.Console.WriteLine("[Builder] WebGL Build Succeeded!");
            EditorApplication.Exit(0);
        }
        else
        {
            System.Console.WriteLine("[Builder] WebGL Build Failed!");
            EditorApplication.Exit(1);
        }
    }
}
