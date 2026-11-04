# OlivoScan 🌿

**OlivoScan** es una aplicación web desarrollada para la empresa **La Aceitunera**, orientada al apoyo del manejo fitosanitario del cultivo de olivo mediante inteligencia artificial.

El sistema permite realizar diagnósticos preliminares de posibles plagas y enfermedades a partir de imágenes de hojas, ramas y frutos del olivo.

## Características principales

- **Diagnóstico con IA:** análisis de imágenes para identificar posibles plagas y enfermedades.
- **Recomendaciones:** información y sugerencias iniciales para el manejo fitosanitario.
- **Historial:** registro y consulta de diagnósticos realizados.
- **Panel de control:** visualización de información y actividad del sistema.
- **Reportes PDF:** generación de documentos con los resultados del diagnóstico.

## Desarrollo del proyecto

El proyecto nació de la necesidad de contar con una herramienta tecnológica que facilite la identificación temprana de problemas fitosanitarios en los cultivos de olivo de la empresa La Aceitunera.

Para su desarrollo se realizó inicialmente un análisis de factibilidad y una especificación de requisitos de software (SRS), donde se definieron las necesidades, funcionalidades y alcance del sistema.

Posteriormente, se desarrolló una aplicación web utilizando inteligencia artificial para el análisis visual de imágenes, junto con servicios de almacenamiento y gestión de información.

## Tecnologías utilizadas

- **Next.js y React:** desarrollo de la aplicación web.
- **Tailwind CSS:** diseño de interfaces.
- **Supabase:** autenticación y base de datos.
- **Google Gemini:** análisis de imágenes mediante inteligencia artificial.
- **Cloudinary:** almacenamiento de imágenes.
- **jsPDF:** generación de reportes PDF.

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/RiveraAugusto/OlivoScan.git
cd OlivoScan
```

Instalar las dependencias:

```bash
npm install
```

Configurar las variables de entorno (.env.local)

Completar las credenciales necesarias de Supabase, Cloudinary y Gemini en `.env.local`.

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.
