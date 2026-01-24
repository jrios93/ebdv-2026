import CardAlumn from "@/components/CardAlumn"
import { Input } from "@/components/ui/input"
import { DATA } from "@/constants"

export default function TeacherPage() {
  return (
    <div className="container p-6 mx-auto flex flex-col gap-6 justify-center ">
      <Input placeholder="Buscar alumno..." className="p-6 bg-white" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {
          DATA.alumns.map((al) => (
            <CardAlumn key={al.idAlumn} name={al.name} />
          ))
        }
      </div>
    </div>
  )
}

