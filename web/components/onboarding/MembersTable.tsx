import { z } from "zod";
import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Mail, Plus, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type MemberRole = "admin" | "member";

export const memberSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  role: z.enum(["member", "admin"] as const),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface Member {
  email: string;
  role: MemberRole;
}

interface MembersTableProps {
  members: Member[];
  onAddMember: (email: string, role: MemberRole) => void;
  onRemoveMember: (email: string) => void;
  ownerEmail: string;
}

export const MembersTable = ({
  members,
  onAddMember,
  onRemoveMember,
  ownerEmail,
}: MembersTableProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [newMemberForm, setNewMemberForm] = useState<MemberFormData>({
    email: "",
    role: "member",
  });

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo<ColumnDef<Member>[]>(
    () => [
      {
        accessorKey: "email",
        header: "User",
        cell: ({ row }) => {
          const email = row.original.email;
          return (
            <div className="flex items-center gap-2.5">
              <span>{email}</span>
              {email === ownerEmail ? (
                <div className="px-1.5 bg-slate-100 rounded">
                  <span className="text-slate-700 text-xs font-medium">
                    YOU
                  </span>
                </div>
              ) : (
                <Badge variant="helicone-sky">INVITED</Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <span className="capitalize">{row.original.role}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const email = row.original.email;
          if (email === ownerEmail) return null;
          return (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveMember(email)}
                className="h-8 w-8 p-0 hover:bg-slate-100"
              >
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          );
        },
      },
    ],
    [ownerEmail, onRemoveMember] // Add dependencies here
  );

  // Memoize table data
  const tableData = useMemo(
    () => [{ email: ownerEmail, role: "owner" as MemberRole }, ...members],
    [members, ownerEmail]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const validateForm = (data: MemberFormData): boolean => {
    try {
      memberSchema.parse(data);
      if (data.email === ownerEmail) {
        setEmailError("This email belongs to the organization owner");
        return false;
      }
      if (members.some((m) => m.email === data.email)) {
        setEmailError("This email has already been invited");
        return false;
      }
      setEmailError("");
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const emailError = error.errors.find((e) => e.path[0] === "email");
        if (emailError) {
          setEmailError(emailError.message);
        }
      }
      return false;
    }
  };

  const handleInvite = () => {
    // Validate form and check for duplicates
    const isValid = validateForm(newMemberForm);
    const isDuplicate = members.some((m) => m.email === newMemberForm.email);

    if (!isValid || isDuplicate) {
      if (isDuplicate) {
        setEmailError("This email has already been invited");
      }
      return;
    }

    onAddMember(newMemberForm.email, newMemberForm.role);
    setNewMemberForm({ email: "", role: "member" });
    setEmailError("");
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-medium text-slate-800">Members</h2>
        <Button variant="outline" size="xs" onClick={() => setIsOpen(true)}>
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-slate-700" />
            <span className="text-slate-900">Invite</span>
          </div>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-none">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No members.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-6 gap-2 w-62">
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Invite a member
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                New members will receive an email to join your organization.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="w-20 text-black text-sm font-normal">
                  Email
                </label>
                <div className="flex-1 flex flex-col gap-1">
                  <Input
                    type="email"
                    value={newMemberForm.email}
                    onChange={(e) => {
                      setNewMemberForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }));
                    }}
                    className={`flex-1 ${
                      emailError
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                    placeholder="Email"
                  />
                  {emailError && (
                    <span className="text-red-500 text-xs">{emailError}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="w-20 text-black text-sm font-normal">
                  Role
                </label>
                <Select
                  value={newMemberForm.role}
                  onValueChange={(value: MemberRole) =>
                    setNewMemberForm((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger className="flex-1 text-sm">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-sky-700 hover:bg-sky-800"
                onClick={handleInvite}
                disabled={!newMemberForm.email}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
