import { Tabs as TabsUI, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"


interface TabsProps {
  tabs: { value: string; label: string }[]
  content: {
    value: string;
    content: React.ReactNode
  }[]
}


export function Tabs({ tabs, content }: TabsProps) {
  return (
    <TabsUI defaultValue={tabs[0].value} className="w-full">
      <TabsList variant="line" className="w-full flex justify-between">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
        ))}
      </TabsList>
      {content.map((item) => (
        <TabsContent key={item.value} value={item.value} className="w-full px-16 py-8">{item.content}</TabsContent>
      ))}
    </TabsUI>
  )
}
