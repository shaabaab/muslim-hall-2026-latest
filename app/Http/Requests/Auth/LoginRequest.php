<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * Supports current Laravel hashes and safely upgrades legacy
     * plain-text/MD5/SHA1/SHA256 passwords to the configured hash driver.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $email = Str::lower(trim((string) $this->input('email')));
        $plainPassword = (string) $this->input('password');

        /** @var \App\Models\User|null $user */
        $user = User::query()
            ->whereRaw('LOWER(email) = ?', [$email])
            ->first();

        if (! $user || ! $this->passwordMatches($plainPassword, (string) $user->getRawOriginal('password'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        $storedPassword = (string) $user->getRawOriginal('password');

        // Upgrade legacy or outdated hashes after a successful password match.
        if ($this->passwordNeedsUpgrade($storedPassword)) {
            $user->forceFill([
                'password' => Hash::make($plainPassword),
            ])->saveQuietly();
        }

        Auth::login($user, $this->boolean('remember'));

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Verify current Laravel hashes and supported legacy password formats.
     */
    private function passwordMatches(string $plainPassword, string $storedPassword): bool
    {
        if ($storedPassword === '') {
            return false;
        }

        try {
            if (Hash::check($plainPassword, $storedPassword)) {
                return true;
            }
        } catch (RuntimeException) {
            // The configured Laravel hasher rejected a legacy hash format.
        }

        return hash_equals($storedPassword, $plainPassword)
            || hash_equals(strtolower($storedPassword), md5($plainPassword))
            || hash_equals(strtolower($storedPassword), sha1($plainPassword))
            || hash_equals(strtolower($storedPassword), hash('sha256', $plainPassword));
    }

    /**
     * Determine whether the stored password should be re-hashed.
     */
    private function passwordNeedsUpgrade(string $storedPassword): bool
    {
        try {
            return Hash::needsRehash($storedPassword);
        } catch (RuntimeException) {
            return true;
        }
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
