import { Section } from "@/components/section";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import QuestionEditor from "@/components/editor/editor";
import { getCachedTagsWithCount } from "./posts/tags/action";
import { TagsSidebar } from "./posts/_components/filter-accordion";
import QuestionMain from "@/components/questions/question-main";

export default async function Home() {
  const payload = await getPayload({ config: configPromise });
  const tagsList = await getCachedTagsWithCount();

  return (
    <>
      <Section className="h-full" sectionClassName="flex flex-1">
        <div className="grid h-full lg:grid-cols-[1fr_4fr_1fr]">
          <aside className="hidden lg:block">
            {/* <TagsSidebar tags={tagsList} /> */}
          </aside>
          <div className="min-w-0 lg:border-border lg:border-x lg:border-dashed">
            {/* <TagsAccordion tags={tagsList} /> */}
            <QuestionMain />
          </div>
          <aside className="hidden lg:block">
            <TagsSidebar tags={tagsList} />
          </aside>
        </div>
      </Section>
    </>
  );
}
