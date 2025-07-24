import PromptForm from "@/components/PromptForm"

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
  
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-center text-gray-900 dark:text-gray-100">
          🧠 ReinAI
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6">
          Your intelligent AI assistant
        </p>
          <PromptForm />
      </div>
    </main>
  )
}
