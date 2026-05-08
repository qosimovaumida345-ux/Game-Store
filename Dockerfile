# Render.com yoki har qanday server uchun yagona gibrid Image!
# Asos sifatida Unity WebGL Editorni olamiz (Bu Linux Ubuntu muhitidir)
FROM unityci/editor:ubuntu-2022.3.16f1-webgl-3

# Endi aynan shu Linux ichiga Node.js 18 versiyasini o'rnatamiz
RUN apt-get update && apt-get install -y curl software-properties-common
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Loglarni aniq ko'rish va tizim qotmasligi uchun ishchi papkani ochamiz
WORKDIR /app

# Barcha VTX Gaming kodlarini Docker ichiga ko'chiramiz
COPY package*.json ./
RUN npm install

# Endi qolgan barcha fayllarni olamiz
COPY . .

# Server portini ochamiz
EXPOSE 3000

# Docker ishga tushganda VTX Gaming Serverini (Express) yoqamiz
# Node.js Server ichki Unity Engine bilan to'g'ridan-to'g'ri muloqot qila oladi!
CMD ["node", "server/index.js"]
