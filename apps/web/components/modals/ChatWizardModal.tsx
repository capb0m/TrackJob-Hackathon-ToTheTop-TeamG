'use client'

import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useChatWizard } from '@/hooks/useChatWizard'
import { useToast } from '@/hooks/useToast'
import { useChatWizardStore } from '@/stores/chatWizardStore'

export function ChatWizardModal() {
  const isOpen = useChatWizardStore((state) => state.isOpen)
  const close = useChatWizardStore((state) => state.close)
  const { toast } = useToast()

  const wizard = useChatWizard()

  const canSave = useMemo(() => wizard.isComplete && wizard.config && !wizard.saving, [wizard.config, wizard.isComplete, wizard.saving])

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          close()
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>チャットウィザード（AI）</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="mb-3 text-xs text-text2">会話で設定を作成し、完了時にまとめて保存します。</div>
          {wizard.mode === 'fallback' ? (
            <p className="mb-3 rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
              AI応答の代わりにルールベースで進行中です。
            </p>
          ) : null}

          <div
            className="max-h-[360px] space-y-3 overflow-y-auto rounded-lg border border-white/10 bg-bg p-3"
            aria-live="polite"
          >
            {wizard.messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.role === 'model'
                    ? 'mr-8 border border-accent/20 bg-accent/10 text-text'
                    : 'ml-8 border border-white/10 bg-card text-text'
                }`}
              >
                {message.content}
              </article>
            ))}
            {wizard.loading ? <p className="text-xs text-text2">AIが回答を生成中です...</p> : null}
          </div>

          {wizard.error ? <p className="mt-3 text-xs text-red-300">{wizard.error}</p> : null}

          {wizard.isComplete && wizard.config ? (
            <div className="mt-3 space-y-2 rounded-lg border border-accent2/30 bg-accent2/10 p-3">
              <p className="text-sm font-semibold">設定プレビュー</p>
              <pre className="overflow-x-auto text-xs text-text2">{JSON.stringify(wizard.config, null, 2)}</pre>
            </div>
          ) : (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                void wizard.send()
              }}
            >
              <Input
                value={wizard.input}
                onChange={(event) => wizard.setInput(event.target.value)}
                placeholder="回答を入力してください"
                disabled={wizard.loading}
                aria-label="チャット入力"
              />
              <Button type="submit" disabled={!wizard.canSend} aria-label="送信">
                送信
              </Button>
            </form>
          )}
        </DialogBody>
        <DialogFooter className="justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                wizard.reset()
              }}
            >
              やり直す
            </Button>
            <Button type="button" variant="ghost" onClick={() => close()}>
              閉じる
            </Button>
          </div>

          <Button
            type="button"
            disabled={!canSave}
            onClick={async () => {
              try {
                const result = await wizard.saveConfig()
                toast({
                  title: result.persisted ? '設定を保存しました' : '設定内容を確認用として保持しました',
                  description: result.persisted ? undefined : 'API未接続のため一部はコンソールログへ出力されています。',
                  variant: result.persisted ? 'success' : 'default',
                })
                close()
                wizard.reset()
              } catch {
                toast({
                  title: '設定保存に失敗しました',
                  variant: 'error',
                })
              }
            }}
          >
            {wizard.saving ? '保存中...' : '保存する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
