import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
          </span>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Error 404
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Página no encontrada
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            La dirección que buscás no existe o fue movida.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
