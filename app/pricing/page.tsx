"use client"

import { useState } from "react"
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
  const [isAnnual, setIsAnnual] = useState(false)

  const pricingTiers: PricingTier[] = [
    {
      id: "free",
      name: "Free",
      description: "Perfect for getting started with basic features",
      price: "$0",
      priceAnnual: "$0",
      pricePeriod: "month",
      features: [
        "Up to 5 projects",
        "Basic analytics",
        "Community support",
        "Standard storage",
        "Basic security",
      ],
      buttonText: "Get Started",
      buttonVariant: "outline",
      icon: <Sparkles className="h-6 w-6" />,
    },
    {
      id: "pro",
      name: "Pro",
      description: "Advanced features for power users and teams",
      price: "$29",
      priceAnnual: "$24",
      pricePeriod: "month",
      features: [
        "Unlimited projects",
        "Advanced analytics",
        "Priority support",
        "Increased storage",
        "Advanced security",
        "API access",
        "Custom integrations",
        "Team collaboration",
      ],
      buttonText: "Upgrade Now",
      buttonVariant: "default",
      popular: true,
      icon: <Zap className="h-6 w-6" />,
    },
  ]

  const comparisonFeatures = [
    { feature: "Projects", free: "5", pro: "Unlimited", proIcon: false },
    { feature: "Storage", free: "10GB", pro: "100GB", proIcon: false },
    { feature: "Users", free: "1", pro: "10", proIcon: false },
    { feature: "Support", free: "Community", pro: "Priority", proIcon: false },
    { feature: "API Access", free: null, pro: null, proIcon: true },
    { feature: "Analytics", free: "Basic", pro: "Advanced", proIcon: false },
    { feature: "Security", free: "Basic", pro: "Advanced", proIcon: false },
    { feature: "SLA", free: null, pro: "99%", proIcon: false },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 text-sm">
              <Award className="mr-2 h-3 w-3" />
              Flexible Pricing Plans
            </Badge>
            <h1 className="mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl lg:text-7xl">
              Choose Your Plan
            </h1>
            <p className="mb-10 text-lg text-muted-foreground md:text-xl">
              Select the perfect plan for your needs. Upgrade or downgrade at any time.
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
                Monthly
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
                Annual
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
                    Most Popular
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
                        Save 20%
                      </Badge>
                    )}
                    {tier.id === "free" && (
                      <Badge variant="secondary" className="text-xs">
                        Free Forever
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
                        Billed annually
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
              <h2 className="mb-3 text-3xl font-bold">Feature Comparison</h2>
              <p className="text-muted-foreground text-lg">Compare plans side by side</p>
            </div>
            
            <Card className="overflow-hidden border-2 shadow-lg">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60 border-b-2">
                      <TableHead className="font-bold text-base py-4">
                        Feature
                      </TableHead>
                      <TableHead className="text-center font-bold text-base py-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-500" />
                            <span>Free</span>
                          </div>
                          <Badge variant="outline" className="text-xs font-medium">
                            $0
                          </Badge>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold text-base py-4 bg-primary/5">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            <span>Pro</span>
                            <Crown className="h-3 w-3 text-primary" />
                          </div>
                          <Badge 
                            variant="default" 
                            className="text-xs font-medium"
                            key={`table-price-${isAnnual}`}
                          >
                            <span className="inline-block animate-in fade-in duration-300">
                              {isAnnual ? "$24" : "$29"}
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
              <h2 className="mb-4 text-3xl font-bold">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Everything you need to know about our pricing</p>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              {[
                {
                  question: "Can I change my plan later?",
                  answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
                },
                {
                  question: "What payment methods do you accept?",
                  answer: "We accept all major credit cards, debit cards, and PayPal. Enterprise customers can also pay via invoice.",
                },
                {
                  question: "Is there a free trial?",
                  answer: "Yes, all paid plans come with a 14-day free trial. No credit card required to start your trial.",
                },
                {
                  question: "What happens if I exceed my plan limits?",
                  answer: "We'll notify you when you're approaching your limits. You can upgrade your plan or purchase additional capacity as needed.",
                },
                {
                  question: "Do you offer refunds?",
                  answer: "Yes, we offer a 30-day money-back guarantee on all paid plans. Contact our support team for assistance.",
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
            <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of satisfied customers. Start your free trial today.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="text-base">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="text-base">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
