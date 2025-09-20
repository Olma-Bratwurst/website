import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/Shadcn/ui/card"

interface InfoboxArgs {
  title: string;
  value: string;
  description: string;
}

function Infobox(args: InfoboxArgs) {
  return (
    <Card className="flex flex-col mt-1 mb-1 sm:mr-1 overflow-hidden">
    <CardHeader className=" p-3 mb-3">
      <div className="flex-1 min-w-[100px] max-w-[500px]">
        <CardTitle>{args.title}</CardTitle>
        </div>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex-1 min-w-[100px] max-w-[500px]">
        {args.value}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex-1 min-w-[100px] max-w-[1015px]">
        <CardDescription>{args.description}</CardDescription>
        </div>
      </div>
    </CardContent>
    </Card>
  )
}

export {
  Infobox
}