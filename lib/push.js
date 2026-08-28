// lib/push.js
import webpush from "web-push";
import { getSupabase } from "./supabase";

webpush.setVapidDetails(
  "mailto:admin@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function saveSubscription(subscription) {
  const supabase = getSupabase();
  const { endpoint, keys } = subscription;

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) throw new Error(error.message);
}

// Manda la notificación a TODOS los dispositivos suscritos. Si alguna
// suscripción ya expiró/fue revocada (error 404/410), la borramos.
export async function sendPushToAll({ title, body, url = "/" }) {
  const supabase = getSupabase();
  const { data: subscriptions, error } = await supabase.from("push_subscriptions").select("*");
  if (error) throw new Error(error.message);
  if (!subscriptions || subscriptions.length === 0) return { sent: 0 };

  const payload = JSON.stringify({ title, body, url });

  let sent = 0;
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent += 1;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    })
  );

  return { sent };
}
