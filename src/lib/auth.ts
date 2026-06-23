import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// React の cache() でリクエスト内の getUser() 呼び出しを1回に集約する。
// layout と各 Server Component の両方から呼んでも Supabase Auth への往復は1度だけ。
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
