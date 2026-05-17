create or replace function public.submit_round1_bet(
  target_question_index integer,
  target_bet_amount integer,
  target_device_fingerprint text
)
returns public.round1_bets
language sql
security definer
set search_path = ''
as $$
  select private.submit_round1_bet_impl(
    target_question_index,
    target_bet_amount,
    target_device_fingerprint
  );
$$;

grant execute on function public.submit_round1_bet(integer, integer, text) to anon, authenticated;
