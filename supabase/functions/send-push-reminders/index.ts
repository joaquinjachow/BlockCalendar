import { withSupabase } from "npm:@supabase/server@1"
import webpush from "npm:web-push@3.6.7"

interface Reminder {
  subscription_id: string
  note_id: string
  occurrence_date: string
  reminder_at: string
  endpoint: string
  p256dh: string
  auth: string
  event_text: string
  event_time: string
}

const publicKey = Deno.env.get("WEB_PUSH_PUBLIC_KEY")
const privateKey = Deno.env.get("WEB_PUSH_PRIVATE_KEY")
const subject = Deno.env.get("WEB_PUSH_SUBJECT")

export default {
  fetch: withSupabase({ auth: "secret" }, async (request, ctx) => {
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 })
    if (!publicKey || !privateKey || !subject) return new Response("Push configuration missing", { status: 503 })

    webpush.setVapidDetails(subject, publicKey, privateKey)
    const db = ctx.supabaseAdmin.schema("block")
    const { data, error } = await db.rpc("due_push_reminders")
    if (error) {
      console.error("Could not load reminders", error.message)
      return new Response("Could not load reminders", { status: 500 })
    }

    let sent = 0
    let failed = 0
    const deliver = async (reminder: Reminder) => {
      const { data: claimId, error: claimError } = await db.rpc("claim_push_reminder", {
        p_subscription_id: reminder.subscription_id,
        p_note_id: reminder.note_id,
        p_occurrence_date: reminder.occurrence_date,
        p_reminder_at: reminder.reminder_at,
      })
      if (claimError) {
        failed += 1
        console.error("Could not claim reminder", claimError.message)
        return
      }
      if (!claimId) return
      try {
        await webpush.sendNotification({
          endpoint: reminder.endpoint,
          keys: { p256dh: reminder.p256dh, auth: reminder.auth },
        }, JSON.stringify({
          title: "Recordatorio de NotaCal",
          body: `${reminder.event_text.slice(0, 200)} · ${reminder.event_time}`,
          tag: `${reminder.note_id}_${reminder.occurrence_date}`,
        }), { TTL: 300, timeout: 10000 })
        const { error: updateError } = await db.from("push_deliveries")
          .update({ sent_at: new Date().toISOString() })
          .eq("subscription_id", reminder.subscription_id).eq("note_id", reminder.note_id)
          .eq("occurrence_date", reminder.occurrence_date).eq("reminder_at", reminder.reminder_at)
          .eq("claim_id", claimId)
        if (updateError) throw updateError
        sent += 1
      } catch (sendError) {
        failed += 1
        const status = (sendError as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          const { error: deleteError } = await db.from("push_subscriptions").delete().eq("id", reminder.subscription_id)
          if (deleteError) console.error("Could not remove expired subscription", deleteError.message)
        } else {
          console.error("Could not send reminder", status || "delivery error")
        }
      }
    }
    const reminders = (data || []) as Reminder[]
    for (let index = 0; index < reminders.length; index += 10) {
      await Promise.all(reminders.slice(index, index + 10).map(deliver))
    }
    return Response.json({ sent, failed })
  }),
}