import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PricePage() {
  return (
    <section className="w-full space-y-12">
      <header className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">收费方向</p>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            未来可能的收费方式
          </h1>
        </div>
        <p className="max-w-2xl text-base text-muted-foreground">
          目前不展示具体价格。以下是我们计划中的收费方向，最终以正式上线为准。
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border border-border/60 bg-white/80 shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">方向 01</Badge>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Community
              </span>
            </div>
            <CardTitle className="text-xl">社区专家分享收费</CardTitle>
            <CardDescription>
              专家以技能/服务形式收费，平台提供分发与交易能力。
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="space-y-2">
              <li>专家可设置付费技能、咨询或模板服务。</li>
              <li>平台按成交抽成（分成比例后续公示）。</li>
              <li>适用于垂直领域专家与高价值场景。</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-white/80 shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">方向 02</Badge>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Subscription
              </span>
            </div>
            <CardTitle className="text-xl">订阅收费</CardTitle>
            <CardDescription>覆盖模型调用、平台功能与生成型能力。</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="space-y-2">
              <li>AI 模型调用额度与稳定性保障。</li>
              <li>平台功能：技能管理、市场运营、协作与权限。</li>
              <li>卡片生图等创作工具与资产化能力。</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
