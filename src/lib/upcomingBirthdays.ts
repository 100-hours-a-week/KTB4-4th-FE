// 친구 생일 날짜를 검증하고 다가오는 생일 목록을 계산하는 유틸리티

import type { UpcomingBirthdayFriend } from "@/lib/api/friends";

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
export const UPCOMING_BIRTHDAY_MAX_DAYS = 7;

export type Birthday = {
  month: number;
  day: number;
};

export type UpcomingBirthday = UpcomingBirthdayFriend & {
  daysUntilBirthday: number;
};

export function parseBirthday(birthDate: string | null): Birthday | null {
  if (!birthDate) {
    return null;
  }

  const match = birthDate.match(/^\d{4}-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  // 윤년인 2000년을 기준으로 2월 29일을 포함한 월·일 유효성 검사
  const date = new Date(Date.UTC(2000, month - 1, day));

  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return { month, day };
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getBirthdayAtUtc(year: number, month: number, day: number) {
  // 2월 29일생은 비윤년에 2월 28일을 생일로 계산
  const observedDay = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day;

  return Date.UTC(year, month - 1, observedDay);
}

export function getDaysUntilBirthday(month: number, day: number, today = new Date()) {
  const todayAtUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  let birthdayAtUtc = getBirthdayAtUtc(today.getFullYear(), month, day);

  if (birthdayAtUtc < todayAtUtc) {
    birthdayAtUtc = getBirthdayAtUtc(today.getFullYear() + 1, month, day);
  }

  return Math.round((birthdayAtUtc - todayAtUtc) / MILLISECONDS_PER_DAY);
}

export function filterUpcomingBirthdays(
  friends: readonly UpcomingBirthdayFriend[],
  today = new Date(),
): UpcomingBirthday[] {
  return friends
    .flatMap((friend) => {
      const birthday = parseBirthday(friend.birthDate);

      if (!birthday) {
        return [];
      }

      const daysUntilBirthday = getDaysUntilBirthday(birthday.month, birthday.day, today);

      return daysUntilBirthday <= UPCOMING_BIRTHDAY_MAX_DAYS
        ? [{ ...friend, daysUntilBirthday }]
        : [];
    })
    .sort(
      (left, right) =>
        left.daysUntilBirthday - right.daysUntilBirthday ||
        left.name.localeCompare(right.name, "ko") ||
        left.userId - right.userId,
    );
}
