create table if not exists public.round2_cases (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  candidate_name text not null,
  major text not null,
  age integer not null check (age >= 18 and age <= 99),
  prompt text not null,
  swot_hints jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (event_id, team_id)
);

create table if not exists public.round2_judge_scores (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  judge_profile_id uuid not null references public.role_profiles(id) on delete cascade,
  analysis_score integer not null check (analysis_score between 0 and 5),
  strategy_score integer not null check (strategy_score between 0 and 5),
  delivery_score integer not null check (delivery_score between 0 and 5),
  notes text,
  total_score integer generated always as (analysis_score + strategy_score + delivery_score) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, team_id, judge_profile_id)
);

create index if not exists round2_cases_event_id_idx
  on public.round2_cases(event_id);

create index if not exists round2_judge_scores_event_team_idx
  on public.round2_judge_scores(event_id, team_id);

create index if not exists round2_judge_scores_judge_profile_idx
  on public.round2_judge_scores(judge_profile_id);

alter table public.round2_cases enable row level security;
alter table public.round2_judge_scores enable row level security;

do $$
declare
  v_event_id uuid;
begin
  select id into v_event_id
  from public.events
  where slug = 'ueh-softskills-2026';

  insert into public.round2_cases (
    event_id,
    team_id,
    candidate_name,
    major,
    age,
    prompt,
    swot_hints
  )
  select
    v_event_id,
    team.id,
    seeded.candidate_name,
    seeded.major,
    seeded.age,
    seeded.prompt,
    seeded.swot_hints
  from (
    values
      (
        'finance',
        'An',
        'Tài chính',
        22,
        'An, 22 tuổi, sinh viên năm 4 ngành Tài chính. GPA 3.6, thường được nhóm giao phần xử lý số liệu và luôn hoàn thành tốt. Trong các buổi thuyết trình nhóm, An thường nhường phần trình bày cho người khác với lý do "bạn kia nói hay hơn". Chưa từng đi thực tập. Hiện tại các công ty fintech đang tuyển dụng mạnh và ưu tiên người biết phân tích dữ liệu, tuy nhiên yêu cầu ứng viên có ít nhất 6 tháng thực tập.',
        '{"S":"Giỏi xử lý số liệu, GPA cao","W":"Ngại thuyết trình, chưa có kinh nghiệm thực tập","O":"Fintech đang tuyển mạnh, ưu tiên phân tích dữ liệu","T":"Yêu cầu 6 tháng thực tập"}'::jsonb
      ),
      (
        'business',
        'Bảo',
        'Quản trị kinh doanh',
        23,
        'Bảo, 23 tuổi, vừa tốt nghiệp ngành Quản trị kinh doanh. Trong các dự án nhóm, Bảo luôn là người đứng ra phân công công việc và cả nhóm đều nghe theo vì Bảo nói chuyện rất có sức thuyết phục. Tuy nhiên giáo viên hướng dẫn đã nhiều lần nhắc về việc nộp báo cáo trễ hạn. Khi được hỏi về số liệu trong buổi bảo vệ đồ án, Bảo thường chuyển câu hỏi sang thành viên khác. Nhiều startup đang tuyển Business Development Executive — cần người biết thuyết phục đối tác và mở rộng thị trường, nhưng đòi hỏi tự lập kế hoạch và theo dõi tiến độ độc lập.',
        '{"S":"Giao tiếp tốt, thuyết phục giỏi, có kinh nghiệm leadership","W":"Hay trễ deadline, yếu phân tích số liệu","O":"Startup tuyển BDE — đúng thế mạnh thuyết phục","T":"Vị trí đòi hỏi tự quản lý tiến độ"}'::jsonb
      ),
      (
        'marketing',
        'Chi',
        'Marketing',
        21,
        'Chi, 21 tuổi, sinh viên năm 3 ngành Marketing. Trang cá nhân về lifestyle của Chi có 5.000 followers và tăng đều mỗi tháng nhờ các video ngắn Chi tự quay và edit. Mỗi khi lớp có bài tập tiếng Anh, Chi thường nhờ bạn bè hỗ trợ hoặc dùng Google Translate. Chưa có bằng chứng chỉ nào. Các agency nước ngoài đang mở văn phòng tại Việt Nam và tuyển Digital Marketer gấp, lương cao nhưng yêu cầu giao tiếp tiếng Anh lưu loát.',
        '{"S":"Giỏi làm content, có personal brand 5.000 followers","W":"Tiếng Anh yếu, không có bằng chứng chỉ","O":"Agency nước ngoài tuyển Digital Marketer gấp","T":"Yêu cầu tiếng Anh lưu loát"}'::jsonb
      ),
      (
        'logistics',
        'Dũng',
        'Logistics',
        24,
        'Dũng, 24 tuổi, đi làm được 1 năm tại công ty logistics nhỏ. Sếp Dũng hay giao việc độc lập vì "giao cho Dũng là yên tâm, đúng giờ, không cần nhắc". Trong các buổi họp bàn cải tiến quy trình, Dũng thường ngồi nghe và gật đầu, hiếm khi lên tiếng dù đôi khi thấy có vấn đề. Gần đây công ty sẽ chuyển toàn bộ quy trình sang hệ thống quản lý kho điện tử mới trong 3 tháng tới. Ngành logistics đang chuyển đổi số mạnh — những nhân viên chủ động học công nghệ mới đang được ưu tiên thăng tiến.',
        '{"S":"Đáng tin cậy, đúng giờ, được sếp tin tưởng","W":"Thụ động, không chủ động đề xuất, ngại học cái mới","O":"Chuyển đổi số mở ra cơ hội thăng tiến","T":"Ai không thích nghi sẽ bị đánh giá thiếu năng động"}'::jsonb
      ),
      (
        'it',
        'Emm',
        'CNTT',
        22,
        'Emm, 22 tuổi, sinh viên năm 4 ngành Công nghệ thông tin. Code giỏi, đã có 2 dự án cá nhân trên GitHub, đạt giải Ba hackathon cấp trường — tất cả đều là dự án solo. Các thành viên nhóm cũ hay nhận xét "làm việc với Emm ra sản phẩm tốt nhưng mệt lắm". Emm thường kết thúc tranh luận bằng câu "cứ làm theo cách tôi đi, tôi biết cách này đúng". Các startup công nghệ đang bùng nổ và rất cần developer giỏi, nhưng đều nhấn mạnh văn hóa teamwork là tiêu chí tuyển dụng hàng đầu.',
        '{"S":"Code giỏi, có portfolio thực tế, từng đạt giải hackathon","W":"Khó làm việc nhóm, không chịu nhận góp ý","O":"Startup bùng nổ, nhu cầu developer cao","T":"Teamwork là tiêu chí hàng đầu — đúng điểm yếu của Emm"}'::jsonb
      ),
      (
        'accounting',
        'Phong',
        'Kế toán',
        23,
        'Phong, 23 tuổi, vừa tốt nghiệp ngành Kế toán. Thầy cô đánh giá Phong là sinh viên hiếm hoi không bao giờ sai một con số trong suốt 4 năm học. Phong không có LinkedIn, chưa từng tham gia câu lạc bộ hay sự kiện nào ngoài giờ học. Khi bạn bè rủ đi networking, Phong thường từ chối vì "mình làm kế toán cần gì quen biết nhiều". Hiện tại nhiều doanh nghiệp đang tuyển kế toán gấp và sẵn sàng nhận sinh viên mới tốt nghiệp, tuy nhiên hầu hết các vị trí yêu cầu ứng viên được giới thiệu qua người quen trong ngành.',
        '{"S":"Chuyên môn vững, tỉ mỉ, cẩn thận","W":"Không có network, không có LinkedIn, tư duy khép kín","O":"Doanh nghiệp tuyển gấp, chấp nhận sinh viên mới","T":"Tuyển qua giới thiệu — đúng điểm yếu thiếu network"}'::jsonb
      ),
      (
        'legal',
        'Giang',
        'Luật',
        21,
        'Giang, 21 tuổi, sinh viên năm 3 ngành Luật. Từng đạt giải Nhất hùng biện cấp khoa, giáo viên nhận xét Giang phân tích tình huống pháp lý rất sắc bén. Nhưng mỗi khi bạn bè hỏi "sau này mày muốn làm gì", Giang chỉ cười trừ. Giang hay so sánh bản thân với người bạn thân đã có định hướng rõ ràng từ năm nhất. Ngành luật đang mở ra nhiều ngách mới như luật công nghệ và luật sở hữu trí tuệ — những lĩnh vực đang thiếu nhân lực trầm trọng nhưng ít sinh viên luật biết đến.',
        '{"S":"Tư duy pháp lý sắc bén, kỹ năng hùng biện tốt","W":"Thiếu định hướng, hay so sánh bản thân","O":"Luật công nghệ và sở hữu trí tuệ thiếu nhân lực","T":"Không có định hướng sẽ bỏ lỡ cơ hội"}'::jsonb
      ),
      (
        'media',
        'Huy',
        'Truyền thông',
        25,
        'Huy, 25 tuổi, đã đi làm 2 năm trong ngành truyền thông. Cứ mỗi lần cần booking địa điểm, mời khách, hay tìm nhà tài trợ — mọi người đều gọi Huy vì "Huy quen hết rồi". Ba sự kiện Huy phụ trách đều diễn ra suôn sẻ. Tuy nhiên mỗi khi sếp yêu cầu viết bài PR hay caption mạng xã hội, Huy thường mất rất nhiều thời gian và kết quả vẫn phải chỉnh sửa nhiều. Các thương hiệu lớn đang cắt giảm ngân sách tổ chức sự kiện trực tiếp và chuyển sang đầu tư mạnh vào content digital.',
        '{"S":"Network rộng, có kinh nghiệm tổ chức sự kiện thực tế","W":"Viết lách yếu, không có bằng cấp chuyên ngành","O":"Thương hiệu đầu tư mạnh vào content digital","T":"Ngân sách sự kiện bị cắt — thế mạnh chính đang mất giá trị"}'::jsonb
      ),
      (
        'trade',
        'Ivy',
        'Ngoại thương',
        22,
        'Ivy, 22 tuổi, sinh viên năm 4 ngành Ngoại thương. IELTS 7.5, từng trao đổi sinh viên tại Singapore 1 học kỳ — là một trong số ít sinh viên khoa có kinh nghiệm học tập quốc tế. Trước mỗi kỳ thi hay deadline quan trọng, Ivy thường nhắn tin hỏi bạn bè "tao làm vậy có đúng không" dù bản thân đã chuẩn bị rất kỹ. Khi nhóm bất đồng ý kiến, Ivy thường chọn im lặng để tránh xung đột. Các tập đoàn đa quốc gia đang tuyển Management Trainee với mức lương hấp dẫn, ưu tiên ứng viên có kinh nghiệm quốc tế — nhưng chương trình nổi tiếng là áp lực cao và đòi hỏi khả năng ra quyết định nhanh.',
        '{"S":"Tiếng Anh xuất sắc, có kinh nghiệm quốc tế","W":"Thiếu quyết đoán, hay lo lắng thái quá, tránh xung đột","O":"Management Trainee ưu tiên đúng profile của Ivy","T":"Chương trình áp lực cao, đòi hỏi ra quyết định nhanh"}'::jsonb
      )
  ) as seeded(team_code, candidate_name, major, age, prompt, swot_hints)
  join public.teams team
    on team.event_id = v_event_id
   and team.team_code = seeded.team_code
  on conflict (event_id, team_id) do update
  set
    candidate_name = excluded.candidate_name,
    major = excluded.major,
    age = excluded.age,
    prompt = excluded.prompt,
    swot_hints = excluded.swot_hints;
end;
$$;

create or replace function private.build_round2_case_snapshot(
  target_event_id uuid,
  target_team_id uuid
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', round2_case.id,
    'team_id', round2_case.team_id,
    'candidate_name', round2_case.candidate_name,
    'major', round2_case.major,
    'age', round2_case.age,
    'prompt', round2_case.prompt,
    'swot_hints', round2_case.swot_hints,
    'team', jsonb_build_object(
      'team_code', team.team_code,
      'display_name', team.display_name,
      'icon', team.icon,
      'sort_order', team.sort_order
    )
  )
  from public.round2_cases round2_case
  join public.teams team
    on team.id = round2_case.team_id
  where round2_case.event_id = target_event_id
    and round2_case.team_id = target_team_id
  limit 1;
$$;

create or replace function private.build_round2_submission_summary(
  target_event_id uuid
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'team_id', team.id,
        'team_code', team.team_code,
        'display_name', team.display_name,
        'icon', team.icon,
        'submission_count', coalesce(score_summary.submission_count, 0),
        'average_total_score', coalesce(score_summary.average_total_score, 0),
        'published_round2_score', coalesce(team_score.round2_score, 0)
      )
      order by team.sort_order asc
    ),
    '[]'::jsonb
  )
  from public.teams team
  left join (
    select
      round2_judge_score.team_id,
      count(*)::integer as submission_count,
      floor(avg(round2_judge_score.total_score))::integer as average_total_score
    from public.round2_judge_scores round2_judge_score
    where round2_judge_score.event_id = target_event_id
    group by round2_judge_score.team_id
  ) score_summary
    on score_summary.team_id = team.id
  left join public.team_scores team_score
    on team_score.event_id = target_event_id
   and team_score.team_id = team.id
  where team.event_id = target_event_id;
$$;

create or replace function public.get_round2_presenter_snapshot(target_event_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  phase_snapshot jsonb;
  active_team_id uuid;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  phase_snapshot := private.build_shared_phase_snapshot(target_event_id);
  active_team_id := nullif(phase_snapshot ->> 'active_team_id', '')::uuid;

  return jsonb_build_object(
    'phase', phase_snapshot,
    'active_case', case
      when active_team_id is null then null
      else private.build_round2_case_snapshot(target_event_id, active_team_id)
    end,
    'judge_submissions', private.build_round2_submission_summary(target_event_id),
    'leaderboard', private.build_leaderboard_snapshot(target_event_id)
  );
end;
$$;

create or replace function public.get_round2_team_snapshot(
  target_event_slug text,
  target_team_code text,
  target_device_fingerprint text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  team_snapshot jsonb := public.get_team_live_snapshot(
    target_event_slug,
    target_team_code,
    target_device_fingerprint
  );
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  active_team_id uuid := nullif(team_snapshot -> 'phase' ->> 'active_team_id', '')::uuid;
  current_team_id uuid := nullif(team_snapshot -> 'team' ->> 'team_id', '')::uuid;
begin
  return team_snapshot || jsonb_build_object(
    'assigned_case', private.build_round2_case_snapshot(target_event_id, current_team_id),
    'is_active_team', active_team_id is not null and active_team_id = current_team_id,
    'judge_submissions', private.build_round2_submission_summary(target_event_id)
  );
end;
$$;

create or replace function public.get_round2_judge_snapshot(
  target_event_slug text,
  target_judge_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  phase_snapshot jsonb;
  judge_profile public.role_profiles%rowtype;
  active_team_id uuid;
  active_case jsonb := null;
  judge_submission jsonb := null;
begin
  if current_user_id is null then
    raise exception 'Authentication required to request the judge snapshot.';
  end if;

  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  select role_profile.*
  into judge_profile
  from public.role_profiles role_profile
  where role_profile.auth_user_id = current_user_id
    and role_profile.role = 'judge'
    and role_profile.is_enabled = true
    and role_profile.event_id = target_event_id
    and role_profile.judge_code = target_judge_code
  limit 1;

  if judge_profile.id is null then
    raise exception 'Signed-in user does not have access to judge route %.', target_judge_code;
  end if;

  phase_snapshot := private.build_shared_phase_snapshot(target_event_id);
  active_team_id := nullif(phase_snapshot ->> 'active_team_id', '')::uuid;

  if active_team_id is not null then
    active_case := private.build_round2_case_snapshot(target_event_id, active_team_id);

    select jsonb_build_object(
      'team_id', round2_judge_score.team_id,
      'analysis_score', round2_judge_score.analysis_score,
      'strategy_score', round2_judge_score.strategy_score,
      'delivery_score', round2_judge_score.delivery_score,
      'total_score', round2_judge_score.total_score,
      'notes', round2_judge_score.notes,
      'updated_at', round2_judge_score.updated_at
    )
    into judge_submission
    from public.round2_judge_scores round2_judge_score
    where round2_judge_score.event_id = target_event_id
      and round2_judge_score.team_id = active_team_id
      and round2_judge_score.judge_profile_id = judge_profile.id
    limit 1;
  end if;

  return jsonb_build_object(
    'phase', phase_snapshot,
    'judge', jsonb_build_object(
      'judge_code', judge_profile.judge_code,
      'display_name', judge_profile.display_name,
      'profile_id', judge_profile.id
    ),
    'active_case', active_case,
    'current_submission', judge_submission,
    'judge_submissions', private.build_round2_submission_summary(target_event_id)
  );
end;
$$;

create or replace function public.get_admin_round2_snapshot(target_event_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  phase_snapshot jsonb;
  active_team_id uuid;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  if not private.is_event_admin(target_event_id) then
    raise exception 'Only admin can request the Round 2 snapshot.';
  end if;

  phase_snapshot := private.build_shared_phase_snapshot(target_event_id);
  active_team_id := nullif(phase_snapshot ->> 'active_team_id', '')::uuid;

  return jsonb_build_object(
    'phase', phase_snapshot,
    'active_case', case
      when active_team_id is null then null
      else private.build_round2_case_snapshot(target_event_id, active_team_id)
    end,
    'judge_submissions', private.build_round2_submission_summary(target_event_id),
    'leaderboard', private.build_leaderboard_snapshot(target_event_id)
  );
end;
$$;

create or replace function public.admin_activate_round2_team(
  target_event_slug text,
  target_team_code text,
  target_stage text default 'discussion',
  target_countdown_seconds integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  admin_profile public.role_profiles%rowtype;
  target_team public.teams%rowtype;
  phase_payload jsonb := jsonb_build_object(
    'label', 'Round 2',
    'round', 'round2',
    'stage', target_stage,
    'activeTeamCode', target_team_code,
    'source', 'admin-round2'
  );
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  select * into admin_profile
  from public.role_profiles
  where auth_user_id = auth.uid()
    and event_id = target_event_id
    and role = 'admin'
    and is_enabled = true
  limit 1;

  if admin_profile.id is null then
    raise exception 'Only admin can activate a Round 2 team.';
  end if;

  select * into target_team
  from public.teams
  where event_id = target_event_id
    and team_code = target_team_code
  limit 1;

  if target_team.id is null then
    raise exception 'Team code % does not exist for Round 2.', target_team_code;
  end if;

  if target_countdown_seconds is not null and target_countdown_seconds > 0 then
    phase_payload := phase_payload || jsonb_build_object(
      'countdownSeconds', target_countdown_seconds,
      'countdownEndsAt', to_jsonb((now() + make_interval(secs => target_countdown_seconds)) at time zone 'utc')
    );
  else
    phase_payload := phase_payload - 'countdownSeconds' - 'countdownEndsAt';
  end if;

  update public.game_state
  set
    current_phase = 'round2',
    phase_payload = phase_payload,
    active_team_id = target_team.id,
    phase_version = phase_version + 1,
    updated_by_profile_id = admin_profile.id,
    updated_at = now()
  where event_id = target_event_id;

  return public.get_admin_round2_snapshot(target_event_slug);
end;
$$;

create or replace function public.admin_set_round2_stage(
  target_event_slug text,
  target_stage text,
  target_countdown_seconds integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  admin_profile public.role_profiles%rowtype;
  current_state public.game_state%rowtype;
  next_payload jsonb;
  active_team_code text := null;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  select * into admin_profile
  from public.role_profiles
  where auth_user_id = auth.uid()
    and event_id = target_event_id
    and role = 'admin'
    and is_enabled = true
  limit 1;

  if admin_profile.id is null then
    raise exception 'Only admin can update Round 2 stage.';
  end if;

  select * into current_state
  from public.game_state
  where event_id = target_event_id
  limit 1;

  if current_state.active_team_id is not null then
    select team_code into active_team_code
    from public.teams
    where id = current_state.active_team_id
    limit 1;
  end if;

  next_payload := coalesce(current_state.phase_payload, '{}'::jsonb) || jsonb_build_object(
    'label', 'Round 2',
    'round', 'round2',
    'stage', target_stage,
    'activeTeamCode', active_team_code,
    'source', 'admin-round2'
  );

  if target_countdown_seconds is not null and target_countdown_seconds > 0 then
    next_payload := next_payload || jsonb_build_object(
      'countdownSeconds', target_countdown_seconds,
      'countdownEndsAt', to_jsonb((now() + make_interval(secs => target_countdown_seconds)) at time zone 'utc')
    );
  else
    next_payload := next_payload - 'countdownSeconds' - 'countdownEndsAt';
  end if;

  update public.game_state
  set
    current_phase = 'round2',
    phase_payload = next_payload,
    phase_version = phase_version + 1,
    updated_by_profile_id = admin_profile.id,
    updated_at = now()
  where event_id = target_event_id;

  return public.get_admin_round2_snapshot(target_event_slug);
end;
$$;

create or replace function public.submit_round2_judge_score(
  target_event_slug text,
  target_team_code text default null,
  target_analysis_score integer default 0,
  target_strategy_score integer default 0,
  target_delivery_score integer default 0,
  target_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  judge_profile public.role_profiles%rowtype;
  target_team_id uuid;
  current_state public.game_state%rowtype;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  select * into judge_profile
  from public.role_profiles
  where auth_user_id = auth.uid()
    and event_id = target_event_id
    and role = 'judge'
    and is_enabled = true
  limit 1;

  if judge_profile.id is null then
    raise exception 'Only judges can submit Round 2 scores.';
  end if;

  if target_team_code is not null then
    select id into target_team_id
    from public.teams
    where event_id = target_event_id
      and team_code = target_team_code
    limit 1;
  else
    select * into current_state
    from public.game_state
    where event_id = target_event_id
    limit 1;

    target_team_id := current_state.active_team_id;
  end if;

  if target_team_id is null then
    raise exception 'No active Round 2 team is currently selected.';
  end if;

  insert into public.round2_judge_scores (
    event_id,
    team_id,
    judge_profile_id,
    analysis_score,
    strategy_score,
    delivery_score,
    notes
  )
  values (
    target_event_id,
    target_team_id,
    judge_profile.id,
    target_analysis_score,
    target_strategy_score,
    target_delivery_score,
    target_notes
  )
  on conflict (event_id, team_id, judge_profile_id) do update
  set
    analysis_score = excluded.analysis_score,
    strategy_score = excluded.strategy_score,
    delivery_score = excluded.delivery_score,
    notes = excluded.notes,
    updated_at = now();

  return public.get_round2_judge_snapshot(target_event_slug, judge_profile.judge_code);
end;
$$;

create or replace function public.admin_publish_round2_result(
  target_event_slug text,
  target_team_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  admin_profile public.role_profiles%rowtype;
  target_team_id uuid;
  current_state public.game_state%rowtype;
  submission_count integer := 0;
  published_score integer := 0;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  select * into admin_profile
  from public.role_profiles
  where auth_user_id = auth.uid()
    and event_id = target_event_id
    and role = 'admin'
    and is_enabled = true
  limit 1;

  if admin_profile.id is null then
    raise exception 'Only admin can publish Round 2 results.';
  end if;

  if target_team_code is not null then
    select id into target_team_id
    from public.teams
    where event_id = target_event_id
      and team_code = target_team_code
    limit 1;
  else
    select * into current_state
    from public.game_state
    where event_id = target_event_id
    limit 1;

    target_team_id := current_state.active_team_id;
  end if;

  if target_team_id is null then
    raise exception 'No active Round 2 team is currently selected.';
  end if;

  select
    count(*)::integer,
    coalesce(floor(avg(round2_judge_score.total_score))::integer, 0)
  into submission_count, published_score
  from public.round2_judge_scores round2_judge_score
  where round2_judge_score.event_id = target_event_id
    and round2_judge_score.team_id = target_team_id;

  if submission_count < 3 then
    raise exception 'Round 2 requires đủ 3 judge submit trước khi publish.';
  end if;

  update public.team_scores
  set
    round2_score = published_score,
    updated_at = now()
  where event_id = target_event_id
    and team_id = target_team_id;

  return public.get_admin_round2_snapshot(target_event_slug);
end;
$$;

grant execute on function public.get_round2_presenter_snapshot(text) to anon, authenticated;
grant execute on function public.get_round2_team_snapshot(text, text, text) to authenticated;
grant execute on function public.get_round2_judge_snapshot(text, text) to authenticated;
grant execute on function public.get_admin_round2_snapshot(text) to authenticated;
grant execute on function public.admin_activate_round2_team(text, text, text, integer) to authenticated;
grant execute on function public.admin_set_round2_stage(text, text, integer) to authenticated;
grant execute on function public.submit_round2_judge_score(text, text, integer, integer, integer, text) to authenticated;
grant execute on function public.admin_publish_round2_result(text, text) to authenticated;
