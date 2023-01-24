import Head from 'next/head'

export default function Home() {
  return (
    <div>
      <Head>
        <title>{`Raghib's blog`}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Welcome to Raghib&apos;s Blog</h1>
      </main>

      <footer></footer>
    </div>
  )
}
