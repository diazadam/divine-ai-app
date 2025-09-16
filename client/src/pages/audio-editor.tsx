import AudioEditor from "@/components/audio-editor";

export default function AudioEditorPage() {
  return (
    <main className="pt-16 min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AudioEditor />
      </div>
    </main>
  );
}