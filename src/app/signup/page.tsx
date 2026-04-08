import { ItemVariant } from "@/components/item-variant"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ItemVariant />
      </div>
    </div>
  )
}
