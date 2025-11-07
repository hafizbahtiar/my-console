"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Zap,
  Crown,
  Sparkles,
  ArrowRight,
  Award,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingTier {
  id: string
  name: string
  description: string
  price: string
  priceAnnual: string
  pricePeriod: string
  features: string[]
  buttonText: string
  buttonVariant: "default" | "outline" | "secondary"
  popular?: boolean
  icon: React.ReactNode
}

export default function PricingPage() {
  const { t } = useTranslation()
  const [isAnnual, setIsAnnual] = useState(false)

  const pricingTiers: PricingTier[] = [
    {
      id: "free",
      name: t("pricing.tiers.free.name"),
      description: t("pricing.tiers.free.description"),
      price: t("pricing.tiers.free.price"),
      priceAnnual: t("pricing.tiers.free.price_annual"),
      pricePeriod: t("pricing.tiers.free.period"),
      features: [
        t("pricing.features.upto_5_projects"),
        t("pricing.features.basic_analytics"),
        t("pricing.features.community_support"),
        t("pricing.features.standard_storage"),
        t("pricing.features.basic_security"),
      ],
      buttonText: t("pricing.get_started"),
      buttonVariant: "outline",
      icon: <Sparkles className="h-6 w-6" />,
    },
    {
      id: "pro",
      name: t("pricing.tiers.pro.name"),
      description: t("pricing.tiers.pro.description"),
      price: t("pricing.tiers.pro.price"),
      priceAnnual: t("pricing.tiers.pro.price_annual"),
      pricePeriod: t("pricing.tiers.pro.period"),
      features: [
        t("pricing.features.unlimited_projects"),
        t("pricing.features.advanced_analytics"),
        t("pricing.features.priority_support"),
        t("pricing.features.increased_storage"),
        t("pricing.features.advanced_security"),
        t("pricing.features.api_access"),
        t("pricing.features.custom_integrations"),
        t("pricing.features.team_collaboration"),
      ],
      buttonText: t("pricing.upgrade_now"),
      buttonVariant: "default",
      popular: true,
      icon: <Zap className="h-6 w-6" />,
    },
  ]

  const comparisonFeatures = [
    { feature: t("pricing.comparison.projects"), free: "5", pro: t("pricing.comparison.unlimited"), proIcon: false },
    { feature: t("pricing.comparison.storage"), free: "10GB", pro: "100GB", proIcon: false },
    { feature: t("pricing.comparison.users"), free: "1", pro: "10", proIcon: false },
    { feature: t("pricing.comparison.support"), free: t("pricing.comparison.community"), pro: t("pricing.comparison.priority"), proIcon: false },
    { feature: t("pricing.comparison.api_access"), free: null, pro: null, proIcon: true },
    { feature: t("pricing.comparison.analytics"), free: t("pricing.comparison.basic"), pro: t("pricing.comparison.advanced"), proIcon: false },
    { feature: t("pricing.comparison.security"), free: t("pricing.comparison.basic"), pro: t("pricing.comparison.advanced"), proIcon: false },
    { feature: t("pricing.comparison.sla"), free: null, pro: "99%", proIcon: false },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 text-sm">
              <Award className="mr-2 h-3 w-3" />
              {t("pricing.badge")}
            </Badge>
            <h1 className="mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl lg:text-7xl">
              {t("pricing.title")}
            </h1>
            <p className="mb-10 text-lg text-muted-foreground md:text-xl">
              {t("pricing.subtitle")}
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 rounded-full border bg-card p-1.5 shadow-sm">
              <button
                onClick={() => setIsAnnual(false)}
                className={cn(
                  "rounded-full px-6 py-2 text-sm font-medium transition-all duration-300",
                  !isAnnual
                    ? "bg-primary text-primary-foreground shadow-sm scale-105"
                    : "text-muted-foreground hover:text-foreground scale-100"
                )}
              >
                {t("pricing.monthly")}
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={cn(
                  "rounded-full px-6 py-2 text-sm font-medium transition-all duration-300",
                  isAnnual
                    ? "bg-primary text-primary-foreground shadow-sm scale-105"
                    : "text-muted-foreground hover:text-foreground scale-100"
                )}
              >
                {t("pricing.annual")}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.id}
              className={cn(
                "relative flex flex-col transition-all duration-300 hover:shadow-lg",
                tier.popular && "border-primary shadow-md"
              )}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge variant="default" className="shadow-sm">
                    <Crown className="mr-1 h-3 w-3" />
                    {t("pricing.most_popular")}
                  </Badge>
                </div>
              )}

              <CardHeader className="space-y-4 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("rounded-lg p-2", tier.popular ? "bg-primary/10" : "bg-muted")}>
                      {tier.icon}
                    </div>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAnnual && tier.id !== "free" && (
                      <Badge 
                        variant="default" 
                        className="animate-in fade-in slide-in-from-right-2 duration-300"
                        key={`save-${tier.id}`}
                      >
                        {t("pricing.save_20")}
                      </Badge>
                    )}
                    {tier.id === "free" && (
                      <Badge variant="secondary" className="text-xs">
                        {t("pricing.free_forever")}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <CardDescription className="text-base">
                  {tier.description}
                </CardDescription>

                <div className="pt-4">
                  <div className="flex items-baseline gap-1 relative min-h-[3.5rem]">
                    <span 
                      key={`price-${tier.id}-${isAnnual}`}
                      className="text-4xl font-bold inline-block transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDuration: '300ms' }}
                    >
                      {isAnnual ? tier.priceAnnual : tier.price}
                    </span>
                    {tier.pricePeriod && (
                      <span className="text-muted-foreground text-lg transition-opacity duration-300">
                        /{tier.pricePeriod}
                      </span>
                    )}
                  </div>
                  <div className="min-h-[1.5rem] transition-all duration-300">
                    {isAnnual && (
                      <p 
                        key={`billed-${tier.id}`}
                        className="mt-1 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-300"
                      >
                        {t("pricing.billed_annually")}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <Separator />
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant={tier.buttonVariant}
                  className="w-full"
                  size="lg"
                >
                  {tier.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-3xl font-bold">{t("pricing.comparison.title")}</h2>
              <p className="text-muted-foreground text-lg">{t("pricing.comparison.subtitle")}</p>
            </div>
            
            <Card className="overflow-hidden border-2 shadow-lg">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60 border-b-2">
                      <TableHead className="font-bold text-base py-4">
                        {t("pricing.comparison.feature")}
                      </TableHead>
                      <TableHead className="text-center font-bold text-base py-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-500" />
                            <span>{t("pricing.tiers.free.name")}</span>
                          </div>
                          <Badge variant="outline" className="text-xs font-medium">
                            {t("pricing.tiers.free.price")}
                          </Badge>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold text-base py-4 bg-primary/5">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            <span>{t("pricing.tiers.pro.name")}</span>
                            <Crown className="h-3 w-3 text-primary" />
                          </div>
                          <Badge 
                            variant="default" 
                            className="text-xs font-medium"
                            key={`table-price-${isAnnual}`}
                          >
                            <span className="inline-block animate-in fade-in duration-300">
                              {isAnnual ? t("pricing.tiers.pro.price_annual") : t("pricing.tiers.pro.price")}
                            </span>
                          </Badge>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonFeatures.map((row, index) => (
                      <TableRow 
                        key={index} 
                        className={cn(
                          "hover:bg-muted/40 transition-colors",
                          index % 2 === 0 && "bg-card"
                        )}
                      >
                        <TableCell className="font-medium py-4">
                          {row.feature}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          {row.free === null ? (
                            <span className="text-muted-foreground text-lg">—</span>
                          ) : (
                            <span className="font-semibold text-sm">{row.free}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-4 bg-primary/5">
                          {row.proIcon ? (
                            <div className="flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-primary fill-primary/20" />
                            </div>
                          ) : row.pro === null ? (
                            <span className="text-muted-foreground text-lg">—</span>
                          ) : (
                            <span className="font-semibold text-sm">{row.pro}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold">{t("pricing.faq.title")}</h2>
              <p className="text-muted-foreground">{t("pricing.faq.subtitle")}</p>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              {[
                {
                  question: t("pricing.faq.q1"),
                  answer: t("pricing.faq.a1"),
                },
                {
                  question: t("pricing.faq.q2"),
                  answer: t("pricing.faq.a2"),
                },
                {
                  question: t("pricing.faq.q3"),
                  answer: t("pricing.faq.a3"),
                },
                {
                  question: t("pricing.faq.q4"),
                  answer: t("pricing.faq.a4"),
                },
                {
                  question: t("pricing.faq.q5"),
                  answer: t("pricing.faq.a5"),
                },
              ].map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold">{t("pricing.cta.title")}</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              {t("pricing.cta.description")}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="text-base">
                {t("pricing.cta.get_started")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="text-base">
                {t("pricing.cta.contact_sales")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
