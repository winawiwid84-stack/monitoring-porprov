<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * User Login with Sanctum Token Generation
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::with('roles')->where('username', $credentials['username'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'error' => 'Username atau kata sandi tidak sesuai'
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'error' => 'Akun dinonaktifkan atau disuspensi'
            ], 403);
        }

        // Revoke old tokens & create new token
        $user->tokens()->delete();
        $token = $user->createToken('koni-bandung-auth')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'full_name' => $user->full_name,
                'role' => $user->roles->first()?->id ?? 'koordinator_posko',
                'assigned_post_id' => $user->assigned_post_id,
            ]
        ]);
    }

    /**
     * Get Current Authenticated User Profile
     */
    public function me(Request $request)
    {
        $user = $request->user()->load('roles');
        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'full_name' => $user->full_name,
            'role' => $user->roles->first()?->id ?? 'koordinator_posko',
            'assigned_post_id' => $user->assigned_post_id,
        ]);
    }

    /**
     * Logout & Revoke Tokens
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Berhasil keluar sistem']);
    }

    /**
     * Change User Password
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['error' => 'Kata sandi saat ini tidak sesuai'], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Kata sandi berhasil diubah']);
    }

    /**
     * Reset Password (Admin Only)
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'user_id' => 'required|string',
        ]);

        $defaultPassword = $request->input('default_password', 'KoniBandung2026!');
        $user = User::findOrFail($request->user_id);
        $user->password = Hash::make($defaultPassword);
        $user->save();

        return response()->json(['message' => 'Kata sandi pengguna berhasil direset']);
    }

    /**
     * Get All Users
     */
    public function getUsers()
    {
        $users = User::with('roles')->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'username' => $u->username,
                'email' => $u->email,
                'full_name' => $u->full_name,
                'role' => $u->roles->first()?->id ?? 'koordinator_posko',
                'assigned_post_id' => $u->assigned_post_id,
                'status' => $u->status,
            ];
        });

        return response()->json($users);
    }
}
