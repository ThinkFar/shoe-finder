import Head from "next/head";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with R3F
const ShoeGrid = dynamic(() => import("@/components/grid/ShoeGrid"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Shoe Finder</title>
        <meta name="description" content="Explore our endless collection of sneakers" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ShoeGrid />
    </>
  );
}
