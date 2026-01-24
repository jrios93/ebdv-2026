import Link from "next/link"

export const Nav = () => {
  return (
    <div className="flex justify-between items-center z-50 mb-10">
      <p>Logo</p>
      <Link href={"/login"}>Ingresar</Link>
    </div>
  )
}

