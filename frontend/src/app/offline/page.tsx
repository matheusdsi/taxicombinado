export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md flex-col items-center justify-center px-5 py-12 text-center">
      <img src="/icons/icon-192.png" alt="" className="mb-5 h-20 w-20 rounded-3xl shadow-sm" />
      <h1 className="text-2xl font-extrabold text-gray-950">Sem conexão</h1>
      <p className="mt-3 text-sm font-medium leading-6 text-gray-600">
        Você está sem internet. Algumas funções do Táxi Combinado precisam de conexão para calcular e salvar cotações.
      </p>
      <a
        href="/"
        className="mt-6 rounded-2xl bg-taxi-500 px-5 py-3 text-sm font-extrabold text-gray-950 shadow-sm transition hover:bg-taxi-600"
      >
        Voltar ao início
      </a>
    </main>
  );
}
