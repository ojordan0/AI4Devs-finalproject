import messages from "@/i18n/es.json";

export default function PlaceholderPage() {
  return (
    <main>
      <h1>{messages.placeholder.title}</h1>
      <p>{messages.placeholder.message}</p>
    </main>
  );
}
