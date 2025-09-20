import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/Shadcn/ui/card"

interface InfoboxArgs {
  title: string;
  value: string;
  description: string;
}

function Infobox(args: InfoboxArgs) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{args.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{args.value}</p>
      </CardContent>
      <CardFooter>
        <CardDescription>{args.description}</CardDescription>
      </CardFooter>
    </Card>
  )
}

export {
  Infobox
}