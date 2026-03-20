import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DialogProps {
  onFinalize: () => void
  onCancel: () => void
  openModal: boolean
  setOpenModal: (open: boolean) => void
}
export function Dialog({ openModal, setOpenModal, onFinalize, onCancel}: DialogProps) {
  return (
    <AlertDialog open={openModal} onOpenChange={setOpenModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar ou Finalizar Pedido?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Esta ação irá finalizar ou cancelar o pedido.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction variant={"secondary"} onClick={onFinalize}>Finalizar</AlertDialogAction>
          <AlertDialogAction variant={"destructive"} onClick={onCancel}>Cancelar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
