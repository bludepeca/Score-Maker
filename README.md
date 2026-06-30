# ScoreMaker 📝

> **Repositorio Privado**
> Aplicación personal para evaluar animes y mangas con precisión granular y sincronización oficial con AniList.

## Características Principales ✨
- **Puntuación Granular (0-100):** Evalúa obras a través de diferentes criterios personalizables (Historia, Personajes, Animación, etc.).
- **Sincronización Bidireccional:** Conexión oficial mediante GraphQL con la API de AniList (OAuth2). 
- **Offline First:** Utiliza `expo-sqlite` y `drizzle-orm` para almacenar localmente las evaluaciones si no hay conexión a internet. Los datos se envían a AniList cuando la conexión regresa gracias a una cola de sincronización.
- **Preparado para la Nube:** Cliente oficial de Supabase integrado (`@supabase/supabase-js`) para futuros respaldos, métricas cruzadas y persistencia entre dispositivos.
- **Interfaz Premium:** Creado con **NativeWind v4** (TailwindCSS) y React Navigation. Cuenta con sliders personalizados, feedback háptico, y soporte nativo para `DarkTheme`.

## Stack Tecnológico 💻
- **Framework:** React Native + Expo (SDK 52/56)
- **Base de Datos Local:** SQLite (expo-sqlite) + Drizzle ORM
- **Base de Datos Cloud (Backend):** Supabase (PostgreSQL)
- **API y Estado:** Apollo Client v4 (`@apollo/client`), GraphQL, Zustand (Auth Store)
- **Estilos:** NativeWind (TailwindCSS)
- **Navegación:** React Navigation v7

## Configuración y Entorno ⚙️
Para correr el proyecto localmente, asegúrate de crear tu archivo `.env.development` en la raíz del proyecto con el siguiente contenido:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=tu_supabase_project_url
EXPO_PUBLIC_SUPABASE_KEY=tu_supabase_anon_key

# AniList (OAuth)
EXPO_PUBLIC_ANILIST_CLIENT_ID=tu_client_id_de_anilist
```

## Instalación y Ejecución 🚀
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar el servidor de desarrollo de Expo (limpiando caché de ser necesario):
   ```bash
   npm start -c
   ```
3. Escanear el QR con **Expo Go** en tu dispositivo.

## Notas para el Desarrollador 📋
- Apollo Client v4 maneja las dependencias de React en módulos separados. Por lo tanto, hooks como `useQuery` o `useMutation` deben importarse siempre desde `@apollo/client/react`, de lo contrario Metro fallará en resolverlos y arrojará el error `undefined`.
- Las variables de entorno en Expo utilizan el prefijo `EXPO_PUBLIC_`. No olvides reiniciar el bundler con `npm start -c` tras modificar el `.env`.
- La pantalla de "Criteria Builder" se encuentra en desarrollo. Por ahora usa los packs base incrustados en `src/utils/calculator.ts`.

---
*Diseñado con el corazón y el cerebro por y para bludepeca.*
