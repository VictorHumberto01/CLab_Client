"use client";

import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { Users, X } from "lucide-react";

const UsersView = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "USER" });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    
    const isAdmin = user?.role === "ADMIN";

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (roleFilter) params.append("role", roleFilter);
            
            const res = await api.get(`/users?${params.toString()}`);
            if (res.data.success) {
                setUsers(res.data.data.users || []);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreating(true);
        setError("");
        try {
            const res = await api.post("/users", newUser);
            if (res.data.success) {
                setShowCreateModal(false);
                setNewUser({ name: "", email: "", password: "", role: "USER" });
                fetchUsers();
            } else {
                setError(res.data.error || "Failed to create user");
            }
        } catch (err) {
            setError("Failed to create user");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <header className="mb-8 border-b border-gray-800 pb-4 app-drag">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Users className="text-amber-500" size={28} />
                        <h1 className="text-2xl font-bold text-white">Gerenciamento de Usuários</h1>
                    </div>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="no-drag bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        + Criar Usuário
                    </button>
                </div>
                <p className="text-gray-400 mt-2 text-sm">
                    {isAdmin ? "Gerencie professores e alunos." : "Gerencie seus alunos."}
                </p>
            </header>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                <button 
                    onClick={() => setRoleFilter("")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!roleFilter ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
                >
                    Todos
                </button>
                {isAdmin && (
                    <button 
                        onClick={() => setRoleFilter("TEACHER")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === "TEACHER" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
                    >
                        Professores
                    </button>
                )}
                <button 
                    onClick={() => setRoleFilter("USER")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === "USER" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
                >
                    Alunos
                </button>
            </div>

            {/* User List */}
            {loading ? (
                <div className="text-center py-12 text-zinc-500">Carregando...</div>
            ) : users.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-xl">
                    <Users size={48} className="mx-auto mb-4 text-zinc-700" />
                    <p className="text-zinc-500">Nenhum usuário encontrado</p>
                </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-zinc-950 border-b border-zinc-800">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase">Nome</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase">Email</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase">Função</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 text-white font-medium">{u.name}</td>
                                    <td className="px-6 py-4 text-zinc-400">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            u.role === "TEACHER" ? "bg-blue-500/20 text-blue-400" :
                                            u.role === "ADMIN" ? "bg-red-500/20 text-red-400" :
                                            "bg-emerald-500/20 text-emerald-400"
                                        }`}>
                                            {u.role === "TEACHER" ? "Professor" : u.role === "ADMIN" ? "Admin" : "Aluno"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Criar Usuário</h2>
                        {error && <p className="text-red-500 text-sm mb-4 bg-red-500/10 p-2 rounded">{error}</p>}
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Nome</label>
                                <input 
                                    type="text" 
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Email</label>
                                <input 
                                    type="email" 
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Senha</label>
                                <input 
                                    type="password" 
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>
                            {isAdmin && (
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Função</label>
                                    <select 
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="USER">Aluno</option>
                                        <option value="TEACHER">Professor</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {creating ? "Criando..." : "Criar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersView;
