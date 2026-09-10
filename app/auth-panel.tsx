'use client';

import { useState, type SubmitEvent } from 'react';
import { CircleDot, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface AccountUser {
  id: string;
  username: string;
}

function CredentialForm({
  mode,
  onAuthenticated,
}: {
  mode: 'login' | 'register';
  onAuthenticated: (user: AccountUser) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const registering = mode === 'register';

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, remember }),
      });
      const payload = (await response.json()) as {
        user?: AccountUser;
        error?: string;
      };
      if (!response.ok || !payload.user) {
        throw new Error(payload.error ?? '操作失败，请稍后重试');
      }
      onAuthenticated(payload.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor={`${mode}-username`}>账号</Label>
        <Input
          id={`${mode}-username`}
          name="username"
          value={username}
          autoComplete="username"
          placeholder="3–24 位账号名"
          className="h-11 text-base"
          onChange={(event) => setUsername(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${mode}-password`}>密码</Label>
        <Input
          id={`${mode}-password`}
          name="password"
          type="password"
          value={password}
          autoComplete={registering ? 'new-password' : 'current-password'}
          placeholder={registering ? '至少 8 位' : '输入密码'}
          className="h-11 text-base"
          minLength={8}
          maxLength={128}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <div className="flex items-center gap-3">
        <Checkbox
          id={`${mode}-remember`}
          checked={remember}
          onCheckedChange={(checked) => setRemember(checked === true)}
        />
        <Label htmlFor={`${mode}-remember`} className="cursor-pointer">
          保持登录 30 天
        </Label>
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-rose-600">
          {error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="h-11 w-full font-black"
        disabled={submitting}
      >
        {submitting ? '请稍候…' : registering ? '创建账号' : '登录'}
      </Button>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        密码只保存加盐哈希；浏览器可自行保存账号密码。
      </p>
    </form>
  );
}

export function AuthPanel({
  onAuthenticated,
}: {
  onAuthenticated: (user: AccountUser) => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#eef6fb] px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 flex items-center justify-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-emerald-400 text-xl font-black text-slate-950">
            O
          </div>
          <div>
            <p className="text-2xl font-black text-slate-950">OfferTrack</p>
            <p className="text-sm text-slate-500">每个账号拥有独立企业列表</p>
          </div>
        </div>

        <Card className="gap-6 rounded-3xl bg-white py-7 shadow-xl shadow-slate-200/70 ring-slate-200">
          <CardHeader className="px-7 text-center">
            <div className="mx-auto mb-2 grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <LockKeyhole className="size-5" />
            </div>
            <CardTitle className="text-2xl font-black">进入秋招清单</CardTitle>
            <CardDescription className="text-sm">
              登录后只会看到你自己的投递记录
            </CardDescription>
          </CardHeader>
          <CardContent className="px-7">
            <Tabs defaultValue="login" className="gap-6">
              <TabsList className="grid h-10 w-full grid-cols-2">
                <TabsTrigger value="login" className="text-base">
                  登录
                </TabsTrigger>
                <TabsTrigger value="register" className="text-base">
                  注册
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <CredentialForm
                  mode="login"
                  onAuthenticated={onAuthenticated}
                />
              </TabsContent>
              <TabsContent value="register">
                <CredentialForm
                  mode="register"
                  onAuthenticated={onAuthenticated}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
          <CircleDot className="size-4 text-emerald-600" />
          自动登录由安全会话完成，不会在网页中明文保存密码
        </p>
      </div>
    </main>
  );
}
