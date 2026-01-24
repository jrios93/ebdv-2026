import { Card, CardContent, CardTitle } from "./ui/card"

interface Props {
  name: string;
}
const CardAlumn = ({ name }: Props) => {
  return (

    <Card className="cursor-pointer">
      <CardTitle>
        <img alt="avatar niño" />
      </CardTitle>
      <CardContent>
        {name}
      </CardContent>
    </Card>
  )
}

export default CardAlumn
