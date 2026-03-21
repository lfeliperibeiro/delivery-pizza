import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "./ui/button"
import { useNavigate } from "react-router-dom"

export interface UsersTableProps {
  id: number,
  name: string,
  email: string,
  active: boolean,
  admin: boolean,
}

export function UsersTable({ users }: { users: UsersTableProps[] }) {
  const navigate = useNavigate()

  function handleEdit(id: number) {
    navigate(`/users/edit/${id}`)
  }

  return (
    <Table>
      <TableCaption>Lista de usuários.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">ID</TableHead>
          <TableHead>Usuário</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Ativo</TableHead>
          <TableHead>Admin</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              Nenhum usuário encontrado.
            </TableCell>
          </TableRow>
        )}
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.id}</TableCell>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.active ? "Sim" : "Não"}</TableCell>
            <TableCell>{user.admin ? "Sim" : "Não"}</TableCell>
            <TableCell>
              <Button variant="ghost" className="text-orange-400 cursor-pointer" onClick={() => handleEdit(user.id)}>Editar</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
