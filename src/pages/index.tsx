import Head from 'next/head'

export default function Home() {
  return (
    <div>
      <Head>
        <title>{`Raghib's blog`}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Hi there 👋 </h1>
        <ul>
          <li>
            <a
              href="https://twitter.com/ragmha"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/in/ragmha/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </li>
          <li>
            <a
              href="https://github.com/ragmha"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </li>
        </ul>
      </main>
      <style jsx>{`
        main {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
        }

        h1 {
          font-size: 3rem;
          margin-bottom: 2rem;
          text-shadow: 2px 2px #808080;
        }

        ul {
          display: flex;
          flex-direction: row;
          justify-content: center;
          list-style: none;
          padding: 0;
        }

        li {
          margin: 0 1rem;
          font-size: 1.5rem;
        }

        a {
          text-decoration: none;
        }

        a:hover {
          text-decoration: underline;
        }
      `}</style>

      <footer></footer>
    </div>
  )
}
