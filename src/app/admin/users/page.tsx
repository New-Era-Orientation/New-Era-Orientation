"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/Card";
import { Button } from "@/client/components/ui/Button";
import { Input } from "@/client/components/ui/Input";
import { Badge } from "@/client/components/ui/Badge";
import { Skeleton } from "@/client/components/ui/Skeleton";
import {
    Users,
    Search,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Shield,
    GraduationCap,
    User,
    Mail,
    Calendar,
    Activity,
    Trash2,
    Edit,
    X,
    Loader2,
} from "lucide-react";

interface UserData {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: "STUDENT" | "TEACHER" | "ADMIN";
    createdAt: string;
    _count: {
        examAttempts: number;
        progress: number;
    };
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const limit = 20;

    useEffect(() => {
        fetchUsers();
        
        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchUsers(true); // silent refresh
        }, 30000);
        
        return () => clearInterval(interval);
    }, [page, roleFilter]);

    const fetchUsers = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: ((page - 1) * limit).toString(),
                ...(search && { search }),
                ...(roleFilter && { role: roleFilter }),
            });

            const res = await fetch(`/api/admin/users?${params}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setTotal(data.total);
                setHasMore(data.hasMore);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const updateUserRole = async (userId: string, role: string) => {
        setUpdating(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role }),
            });

            if (res.ok) {
                setUsers((prev) =>
                    prev.map((u) =>
                        u.id === userId ? { ...u, role: role as UserData["role"] } : u
                    )
                );
                setShowEditModal(false);
            }
        } catch (error) {
            console.error("Error updating user:", error);
        } finally {
            setUpdating(false);
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setUsers((prev) => prev.filter((u) => u.id !== userId));
                setTotal((prev) => prev - 1);
            }
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "ADMIN":
                return <Shield className="h-4 w-4 text-red-500" />;
            case "TEACHER":
                return <GraduationCap className="h-4 w-4 text-blue-500" />;
            default:
                return <User className="h-4 w-4 text-gray-400" />;
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "ADMIN":
                return <Badge variant="error">Admin</Badge>;
            case "TEACHER":
                return <Badge variant="default">Giáo viên</Badge>;
            default:
                return <Badge variant="default">Học sinh</Badge>;
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("vi-VN");
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Quản lý người dùng
                            </h1>
                            <p className="text-gray-500">{total} người dùng</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tìm theo tên hoặc email..."
                                    className="flex-1"
                                />
                                <Button type="submit" variant="outline">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </form>

                            <div className="flex gap-2">
                                {["", "STUDENT", "TEACHER", "ADMIN"].map((role) => (
                                    <Button
                                        key={role}
                                        variant={roleFilter === role ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            setRoleFilter(role);
                                            setPage(1);
                                        }}
                                    >
                                        {role === ""
                                            ? "Tất cả"
                                            : role === "STUDENT"
                                            ? "Học sinh"
                                            : role === "TEACHER"
                                            ? "Giáo viên"
                                            : "Admin"}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-medium">Người dùng</th>
                                        <th className="text-left p-4 font-medium">Vai trò</th>
                                        <th className="text-left p-4 font-medium">Hoạt động</th>
                                        <th className="text-left p-4 font-medium">Ngày tham gia</th>
                                        <th className="text-right p-4 font-medium">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: 10 }).map((_, i) => (
                                            <tr key={i} className="border-b">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <Skeleton className="h-10 w-10 rounded-full" />
                                                        <div>
                                                            <Skeleton className="h-4 w-32 mb-1" />
                                                            <Skeleton className="h-3 w-48" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Skeleton className="h-6 w-20" />
                                                </td>
                                                <td className="p-4">
                                                    <Skeleton className="h-4 w-24" />
                                                </td>
                                                <td className="p-4">
                                                    <Skeleton className="h-4 w-24" />
                                                </td>
                                                <td className="p-4">
                                                    <Skeleton className="h-8 w-8 ml-auto" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">
                                                Không tìm thấy người dùng nào
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                                            {user.image ? (
                                                                <img
                                                                    src={user.image}
                                                                    alt=""
                                                                    className="w-full h-full rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                user.name?.charAt(0) || "U"
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {user.name || "Chưa đặt tên"}
                                                            </p>
                                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">{getRoleBadge(user.role)}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                                        <Activity className="h-4 w-4" />
                                                        {user._count.examAttempts} bài thi
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                                        <Calendar className="h-4 w-4" />
                                                        {formatDate(user.createdAt)}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowEditModal(true);
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600"
                                                            onClick={() => deleteUser(user.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-500">
                        Hiển thị {(page - 1) * limit + 1}-{Math.min(page * limit, total)} / {total}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={!hasMore}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Chỉnh sửa người dùng</CardTitle>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                    {selectedUser.name?.charAt(0) || "U"}
                                </div>
                                <div>
                                    <p className="font-medium">{selectedUser.name}</p>
                                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Vai trò</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {["STUDENT", "TEACHER", "ADMIN"].map((role) => (
                                        <Button
                                            key={role}
                                            variant={selectedUser.role === role ? "default" : "outline"}
                                            className="w-full"
                                            onClick={() =>
                                                setSelectedUser((prev) =>
                                                    prev ? { ...prev, role: role as UserData["role"] } : null
                                                )
                                            }
                                        >
                                            {role === "STUDENT"
                                                ? "Học sinh"
                                                : role === "TEACHER"
                                                ? "Giáo viên"
                                                : "Admin"}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() =>
                                        updateUserRole(selectedUser.id, selectedUser.role)
                                    }
                                    disabled={updating}
                                >
                                    {updating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Lưu thay đổi"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
