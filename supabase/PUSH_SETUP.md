# Configuración de notificaciones push

Los avisos se activan desde la aplicación instalada. La página abierta en el navegador no solicita el permiso. En iPhone/iPad se necesita iOS/iPadOS 16.4 o posterior y agregar la aplicación a la pantalla de inicio. En Android se necesita una PWA instalada, un navegador compatible y una conexión HTTPS.

La aplicación, la función y el trabajo programado deben usar el mismo proyecto de Supabase. No agregar claves privadas ni secretos al repositorio.

## Preparación

1. Generar un par de claves VAPID con `npx web-push generate-vapid-keys` y guardarlo de forma segura. La clave pública se reutiliza para todas las instalaciones; no hay que generar una por dispositivo.
2. Configurar `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` con la clave pública en el entorno de compilación de la aplicación. La variable está en `.env.example`. Volver a compilar y desplegar la aplicación después de configurarla.
3. Aplicar la migración `migrations/20261106000003_push_reminders.sql` al proyecto Supabase que usa Block. Antes, confirmar que existen el esquema `block` y la tabla `block.notes`, y que `block` está expuesto en la API.
4. Configurar los secretos de la Edge Function: `WEB_PUSH_PUBLIC_KEY` con la misma clave pública, `WEB_PUSH_PRIVATE_KEY` con su clave privada y `WEB_PUSH_SUBJECT` con un contacto válido, por ejemplo `mailto:administrador@ejemplo.com`. Desplegar `send-push-reminders` usando `supabase/config.toml`, que desactiva la verificación JWT en la puerta de enlace; la función valida la clave secreta de Supabase con `auth: 'secret'`. Nunca usar la clave publicable para invocarla.
5. Habilitar `pg_cron` y `pg_net`. Guardar en Vault la URL del proyecto con el nombre `block_project_url` y la clave secreta **default** del proyecto con el nombre `block_supabase_secret_key`. Crear un trabajo que ejecute cada minuto el SQL siguiente:

```sql
select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name = 'block_project_url') || '/functions/v1/send-push-reminders',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'block_supabase_secret_key')
  ),
  body := '{}'::jsonb
);
```

Supabase advierte que la clave descifrada puede quedar temporalmente en la cola de solicitudes de `pg_net`, accesible para roles que puedan iniciar sesión en la base. Revisar los permisos de esos roles antes de habilitar el trabajo.

## Comprobación

1. Abrir la PWA instalada, iniciar sesión y tocar **Activar avisos**. Aceptar el permiso del sistema en cada dispositivo.
2. Crear una actividad con hora y recordatorio, cerrar la PWA y esperar el aviso. Repetir en Android y iPhone reales y probar una actividad repetitiva, una completada antes del aviso y la eliminación de una actividad.
3. Revisar el historial del trabajo Cron y los registros de la Edge Function si el aviso no llega. El trabajo revisa avisos de los últimos cinco minutos; si está detenido más tiempo, no recupera los vencidos fuera de esa ventana. Las entregas temporalmente fallidas pueden reintentarse después de dos minutos, mientras sigan dentro de la ventana.
4. Al cerrar sesión se intenta quitar la suscripción del dispositivo; al volver a ingresar hay que activar los avisos otra vez. Si el permiso está bloqueado, debe habilitarse en los ajustes de notificaciones del sistema.

La hora de cada actividad se interpreta en la zona horaria del dispositivo. Al cambiar de zona horaria, abrir la PWA con conexión para actualizar la suscripción. Con distintos dispositivos en distintas zonas, cada uno usa su propia zona.