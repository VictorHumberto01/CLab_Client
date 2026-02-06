"use client";

import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { Users, X, Copy, CheckCircle } from "lucide-react";

const UsersView = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", matricula: "", role: "USER" });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [createdUser, setCreatedUser] = useState(null); // To show the initial password
    
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
                setCreatedUser(res.data.data);
                setNewUser({ name: "", matricula: "", role: "USER" });
                fetchUsers();
            } else {
                setError(res.data.error || "Failed to create user");
            }
        } catch (err) {
            setError(err.response?.data?.error || "Failed to create user");
        } finally {
            setCreating(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setCreatedUser(null);
        setError("");
    };

    return (
        <div className="animate-in fade-in duration-500">
            <header className="mb-8 border-b border-border pb-4 app-drag">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Users className="text-primary" size={28} />
                        <h1 className="text-2xl font-bold text-foreground">Gerenciamento de Usuários</h1>
                    </div>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="no-drag bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        + Criar Usuário
                    </button>
                </div>
                <p className="text-secondary mt-2 text-sm">
                    {isAdmin ? "Gerencie professores e alunos." : "Gerencie seus alunos."}
                </p>
            </header>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                <button 
                    onClick={() => setRoleFilter("")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!roleFilter ? "bg-surface-hover text-foreground" : "bg-surface text-secondary hover:bg-surface-hover"}`}
                >
                    Todos
                </button>
                {isAdmin && (
                    <button 
                        onClick={() => setRoleFilter("TEACHER")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === "TEACHER" ? "bg-primary text-white" : "bg-surface text-secondary hover:bg-surface-hover"}`}
                    >
                        Professores
                    </button>
                )}
                <button 
                    onClick={() => setRoleFilter("USER")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === "USER" ? "bg-primary text-white" : "bg-surface text-secondary hover:bg-surface-hover"}`}
                >
                    Alunos
                </button>
            </div>

            {/* User List */}
            {loading ? (
                <div className="text-center py-12 text-secondary">Carregando...</div>
            ) : users.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                    <Users size={48} className="mx-auto mb-4 text-secondary" />
                    <p className="text-secondary">Nenhum usuário encontrado</p>
                </div>
            ) : (
                <div className="bg-surface border border-border rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-background border-b border-border">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-secondary uppercase">Nome</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-secondary uppercase">Matrícula</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-secondary uppercase">Email</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-secondary uppercase">Função</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-surface-hover transition-colors">
                                    <td className="px-6 py-4 text-foreground font-medium">{u.name}</td>
                                    <td className="px-6 py-4 text-secondary font-mono">{u.matricula || "-"}</td>
                                    <td className="px-6 py-4 text-secondary">{u.email || <span className="text-yellow-500 text-xs">Pendente</span>}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            u.role === "TEACHER" ? "bg-primary/20 text-primary" :
                                            u.role === "ADMIN" ? "bg-red-500/20 text-red-400" :
                                            "bg-primary/20 text-primary"
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
                    <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
                        {createdUser ? (
                            // Success: Show the created user info and password
                            <div className="text-center">
                                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                                <h2 className="text-xl font-bold text-foreground mb-2">Usuário Criado!</h2>
                                <p className="text-secondary text-sm mb-6">Compartilhe essas credenciais com o aluno:</p>
                                
                                <div className="bg-background border border-border rounded-lg p-4 text-left space-y-3">
                                    <div>
                                        <span className="text-xs text-secondary">Nome:</span>
                                        <p className="text-foreground font-medium">{createdUser.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-secondary">Matrícula:</span>
                                        <p className="text-foreground font-mono">{createdUser.matricula}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-secondary">Senha Inicial:</span>
                                        <div className="flex items-center gap-2">
                                            <p className="text-foreground font-mono text-lg">{createdUser.initialPassword}</p>
                                            <button 
                                                onClick={() => copyToClipboard(createdUser.initialPassword)}
                                                className="p-1 hover:bg-surface-hover rounded transition-colors"
                                                title="Copiar senha"
                                            >
                                                <Copy size={16} className="text-secondary" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-secondary mt-4">
                                    O aluno poderá alterar a senha no primeiro login.
                                </p>

                                <button 
                                    onClick={closeModal}
                                    className="mt-6 w-full bg-primary hover:bg-primary-hover text-white py-2 rounded-lg font-medium transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        ) : (
                            // Form to create user
                            <>
                                <h2 className="text-xl font-bold text-foreground mb-4">Criar Usuário</h2>
                                {error && <p className="text-red-500 text-sm mb-4 bg-red-500/10 p-2 rounded">{error}</p>}
                                <form onSubmit={handleCreateUser} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-secondary mb-1">Nome</label>
                                        <input 
                                            type="text" 
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-secondary mb-1">Matrícula</label>
                                        <input 
                                            type="text" 
                                            value={newUser.matricula}
                                            onChange={(e) => setNewUser({...newUser, matricula: e.target.value})}
                                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="Ex: 2024001234"
                                            required
                                        />
                                    </div>
                                    {isAdmin && (
                                        <div>
                                            <label className="block text-sm text-secondary mb-1">Função</label>
                                            <select 
                                                value={newUser.role}
                                                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                <option value="USER">Aluno</option>
                                                <option value="TEACHER">Professor</option>
                                            </select>
                                        </div>
                                    )}
                                    <p className="text-xs text-secondary">
                                        Uma senha inicial será gerada automaticamente.
                                    </p>
                                    <div className="flex gap-3 pt-4">
                                        <button 
                                            type="button"
                                            onClick={closeModal}
                                            className="flex-1 bg-surface-hover hover:bg-surface border border-border text-foreground py-2 rounded-lg font-medium transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={creating}
                                            className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                        >
                                            {creating ? "Criando..." : "Criar"}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersView;
