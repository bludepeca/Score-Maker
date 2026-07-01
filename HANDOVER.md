# ScoreMaker - Antigravity Handover Context 🤖

**Hola colega (mi yo del futuro en Windows 10)!**
Si estás leyendo esto, es porque bludepeca ha cambiado de PC y necesitas ponerte al corriente con todo el progreso de la aplicación *ScoreMaker*. Aquí tienes el contexto exacto de dónde lo dejamos:

## 1. El Proyecto: ScoreMaker
- **Qué es:** Una app móvil construida en React Native + Expo (SDK 56) + NativeWind v4 para que el usuario pueda puntuar animes de manera granular y con criterios súper específicos (ej. Historia, Personajes, OST).
- **Backend/Estado:** Usa Apollo Client v4 para leer y escribir directamente en **AniList (GraphQL)**, Zustand para estado global (Tokens de auth), y Supabase inicializado (para futuras copias de seguridad en la nube).
- **Modo Offline:** La app tiene una fuerte prioridad "Offline-First". Todo se guarda en `expo-sqlite` usando `drizzle-orm`. Si no hay internet al guardar en AniList, el trabajo queda encolado en `syncQueue` (ver `syncService.ts`).

## 2. Lo que logramos hasta ahora
- **Login OAuth2:** Funciona perfecto con AniList (`expo-auth-session`). Redirige mediante deep linking.
- **HomeScreen:** Se lista automáticamente los animes recientes y vistos del usuario. Al tocar uno, navega a `RatingScreen` pasando el pack por defecto (`anime_general`) silenciosamente para no interrumpir al usuario.
- **RatingScreen y UX del Slider:** Se eliminó el viejo ScrollView que daba problemas de gestos táctiles. Ahora usamos un sistema de índice de estado (`currentIndex`). El slider desliza perfecto. Al llegar al final, la nota se envía por mutación oficial GraphQL a AniList y a SQLite.
- **Tema Oscuro Forzado:** El NavigationContainer tiene configurado el `DarkTheme` de React Navigation para evitar flashes blancos al cambiar de pantalla.

## 3. Próximos pasos pendientes (El TODO list)
bludepeca quiere enfocarse en lo siguiente:
- **CriteriaBuilderScreen:** La pantalla existe y se abre tocando la tuerquita (⚙️) en el HomeScreen, pero actualmente es solo un UI de mentira ("En desarrollo"). ¡Hay que crear la lógica para diseñar, guardar y editar packs de criterios de verdad (con Drizzle/SQLite o Supabase)!
- **Supabase Backend:** El setup local del cliente Supabase está en `supabase.ts`, pero no estamos sincronizando nada activamente hacia allá más allá de los placeholders que dejamos. La guía paso a paso de Supabase ya se la pasé.

## 4. Instrucciones para migrar al otro PC
bludepeca, para usar este repo en tu Windows 10:
1. Clona/descarga el repositorio en Windows 10.
2. Copia el archivo `.env.example` y renómbralo a `.env.development`.
3. Completa los valores de Supabase (si ya hiciste la guía) y asegúrate de que el `EXPO_PUBLIC_ANILIST_CLIENT_ID` sea `44722`.
4. Corre `npm install`.
5. Dile a tu nuevo Antigravity: *"Hola, lee el archivo HANDOVER.md para entrar en contexto"* ¡y seguirán programando justo donde lo dejamos!
