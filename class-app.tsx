import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  House,
  LogOut,
  Plus,
  Shield,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HOMEROOM,
  ORGANIZATION,
  PICKET,
  SCHOOL_DAYS,
  SUBJECTS,
  ADMIN_TOKEN_KEY,
  formatLong,
  formatShort,
  initials,
  isStatus,
  localToday,
  nameKey,
  shiftDay,
  weekdayName,
  type Board,
  type Status,
} from "@/lib/class-board";
import {
  addStudent,
  addTask,
  deleteTask,
  getBoard,
  importBackup,
  loginAdmin,
  logoutAdmin,
  markDay,
  saveNote,
  setAttendance,
} from "@/lib/class-board.functions";

type PageId = "beranda" | "tugas" | "absensi" | "jadwal" | "organisasi" | "admin";

const NAV: { id: PageId; label: string; short: string; icon: typeof House }[] = [
  { id: "beranda", label: "Beranda", short: "Home", icon: House },
  { id: "tugas", label: "Tugas", short: "Tugas", icon: ClipboardList },
  { id: "absensi", label: "Absensi", short: "Absensi", icon: Check },
  { id: "jadwal", label: "Jadwal", short: "Jadwal", icon: CalendarRange },
  { id: "organisasi", label: "Organisasi", short: "Kelas", icon: Users },
];

const TITLES: Record<PageId, string> = {
  beranda: "Beranda",
  tugas: "Daftar Tugas",
  absensi: "Absensi Kelas",
  jadwal: "Jadwal Kelas",
  organisasi: "Organisasi Kelas",
  admin: "Panel Admin",
};

function errorText(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return "Gagal menyimpan. Coba lagi.";
}

function statusClass(status: Status | null): string {
  if (!status) return "status-empty";
  return `status-${status.toLowerCase()}`;
}

export function ClassApp({ initial }: { initial: Board }) {
  const queryClient = useQueryClient();
  const boardQuery = useQuery({
    queryKey: ["board"],
    queryFn: () => getBoard(),
    initialData: initial,
    refetchInterval: 8000,
  });
  const board = boardQuery.data;
  const [page, setPage] = useState<PageId>("beranda");
  const [day, setDay] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState<"semua" | "aktif" | "selesai">("semua");
  const [scheduleTab, setScheduleTab] = useState<"pelajaran" | "piket">("pelajaran");
  const [nameQuery, setNameQuery] = useState("");
  const [doneIds, setDoneIds] = useState<number[]>([]);
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    label: string;
    run: () => Promise<void> | void;
  } | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    setDay(localToday());
    setToken(sessionStorage.getItem(ADMIN_TOKEN_KEY));
    try {
      const raw = JSON.parse(localStorage.getItem("xi_tkj_done_tasks_v2") || "[]") as unknown;
      if (Array.isArray(raw)) setDoneIds(raw.filter((id) => typeof id === "number"));
    } catch {
      /* ignore broken local checklist */
    }
  }, []);

  function ping(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  }

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["board"] });
  }

  function rememberToken(next: string | null) {
    setToken(next);
    if (next) sessionStorage.setItem(ADMIN_TOKEN_KEY, next);
    else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  }

  async function guarded(work: () => Promise<void>) {
    try {
      await work();
      await refresh();
    } catch (error) {
      const message = errorText(error);
      if (/sesi admin/i.test(message)) rememberToken(null);
      ping(message);
    }
  }

  const today = day;
  const todayName = day ? weekdayName(day) : "";
  const todayRecords = board.attendance.filter((row) => row.day === today);
  const recordByStudent = new Map(todayRecords.map((row) => [row.studentId, row]));
  const activeTasks = board.tasks.filter((task) => !doneIds.includes(task.id));
  const filled = todayRecords.length;
  const updatedLabel = boardQuery.dataUpdatedAt
    ? new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(
        boardQuery.dataUpdatedAt,
      )
    : "";

  function toggleDone(id: number) {
    setDoneIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem("xi_tkj_done_tasks_v2", JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="min-h-dvh bg-bg text-fg md:grid md:grid-cols-[16.5rem_1fr]">
      <div className="h-1 bg-primary md:col-span-2" />
      <aside className="hidden border-r border-line bg-rail px-4 py-6 md:flex md:flex-col md:gap-6">
        <Brand />
        <p className="px-2 text-xs font-semibold tracking-widest text-muted">MENU UTAMA</p>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavButton key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} badge={item.id === "tugas" ? activeTasks.length : 0} />
          ))}
          <button
            type="button"
            onClick={() => setPage("admin")}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-left font-medium ${page === "admin" ? "bg-raised text-fg" : "text-muted"}`}
          >
            <Shield className="size-5" />
            Panel Admin
          </button>
        </nav>
        <div className="mt-auto rounded-card border border-line bg-surface p-4">
          <p className="font-display text-lg font-semibold">Semangat, XI TKJ.</p>
          <p className="mt-1 text-sm text-muted">Satu rekap, semua HP.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-4 md:px-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-primary">
              {page === "beranda" ? "KELAS DIGITAL" : "XI TKJ"}
            </p>
            <h1 className="truncate font-display text-2xl font-semibold tracking-tight">{TITLES[page]}</h1>
          </div>
          <button
            type="button"
            onClick={() => setPage("admin")}
            className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3 pl-1"
          >
            <span className="grid size-9 place-items-center rounded-full bg-primary font-semibold text-ink">
              {token ? "N" : "XI"}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold">{token ? "Nazril" : "Tamu kelas"}</span>
              <span className="block text-xs text-muted">{token ? "Admin" : "Bisa melihat"}</span>
            </span>
          </button>
        </header>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-28 md:px-8 md:pb-10">
          {page === "beranda" && (
            <HomePage
              board={board}
              today={today}
              todayName={todayName}
              filled={filled}
              activeCount={activeTasks.length}
              recordByStudent={recordByStudent}
              updatedLabel={day ? updatedLabel : ""}
              onOpen={setPage}
            />
          )}
          {page === "tugas" && (
            <TasksPage
              board={board}
              filter={filter}
              setFilter={setFilter}
              doneIds={doneIds}
              today={today}
              onToggle={toggleDone}
            />
          )}
          {page === "absensi" && (
            <AttendancePage
              board={board}
              day={today}
              setDay={setDay}
              token={token}
              nameQuery={nameQuery}
              setNameQuery={setNameQuery}
              onPing={ping}
              onGuarded={guarded}
              ask={(next) => setConfirm(next)}
              goAdmin={() => setPage("admin")}
            />
          )}
          {page === "jadwal" && (
            <SchedulePage tab={scheduleTab} setTab={setScheduleTab} todayName={todayName} />
          )}
          {page === "organisasi" && <OrgPage />}
          {page === "admin" && (
            <AdminPage
              token={token}
              board={board}
              today={today}
              onPing={ping}
              onGuarded={guarded}
              onLogin={rememberToken}
              ask={(next) => setConfirm(next)}
            />
          )}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-rail px-1 py-1 md:hidden">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPage(item.id)}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${active ? "text-primary" : "text-muted"}`}
            >
              <Icon className="size-5" />
              {item.short}
              {item.id === "tugas" && activeTasks.length > 0 && (
                <span className="absolute top-1 right-3 size-2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {toast && (
        <div className="fixed inset-x-4 bottom-24 z-30 rounded-card border border-line bg-raised px-4 py-3 text-sm shadow-lg md:inset-x-auto md:right-8 md:bottom-8 md:max-w-sm">
          {toast}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-rail/80 px-4">
          <div className="w-full max-w-md rounded-card border border-line bg-surface p-5">
            <h2 className="font-display text-2xl font-semibold">{confirm.title}</h2>
            <p className="mt-2 text-sm text-muted">{confirm.body}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="min-h-11 rounded-xl border border-line px-4" onClick={() => setConfirm(null)}>
                Batal
              </button>
              <button
                type="button"
                className="min-h-11 rounded-xl bg-primary px-4 font-semibold text-ink"
                onClick={() => {
                  const action = confirm.run;
                  setConfirm(null);
                  void action();
                }}
              >
                {confirm.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-1">
      <span className="grid size-11 place-items-center rounded-2xl bg-primary font-display text-lg font-semibold text-ink">
        XI
      </span>
      <span>
        <span className="block font-display text-xl leading-none font-semibold">XI TKJ</span>
        <span className="text-xs tracking-widest text-muted">KELAS DIGITAL</span>
      </span>
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
  badge,
}: {
  item: (typeof NAV)[number];
  active: boolean;
  onClick: () => void;
  badge: number;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-left font-medium ${active ? "bg-raised text-fg" : "text-muted"}`}
    >
      <Icon className="size-5" />
      <span className="flex-1">{item.label}</span>
      {badge > 0 && (
        <span className="rounded-full bg-primary px-2 text-xs font-semibold text-ink">{badge}</span>
      )}
    </button>
  );
}

function HomePage({
  board,
  today,
  todayName,
  filled,
  activeCount,
  recordByStudent,
  updatedLabel,
  onOpen,
}: {
  board: Board;
  today: string;
  todayName: string;
  filled: number;
  activeCount: number;
  recordByStudent: Map<number, Board["attendance"][number]>;
  updatedLabel: string;
  onOpen: (page: PageId) => void;
}) {
  const subjects = SUBJECTS[todayName] ?? [];
  const piket = PICKET[todayName] ?? [];
  const upcoming = [...board.tasks]
    .filter((task) => true)
    .sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"))
    .slice(0, 3);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <section className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="grid gap-6 p-5 md:grid-cols-[1.4fr_0.8fr] md:p-7">
          <div>
            <p className="text-xs font-semibold tracking-widest text-primary">RUANG KELAS BERSAMA</p>
            <h2 className="mt-2 font-display text-4xl leading-tight font-semibold">
              Halo, keluarga <span className="text-primary italic">XI TKJ</span>
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Absensi yang diisi admin langsung kelihatan di HP teman. Bukan catatan pribadi di satu browser.
            </p>
            <p className="mt-4 text-sm font-medium">{today ? formatLong(today) : "Hari ini"}</p>
          </div>
          <div className="rounded-2xl border border-line bg-rail p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-widest text-muted">ABSENSI HARI INI</p>
                <p className="font-display text-4xl font-semibold">
                  {filled}
                  <span className="text-xl text-muted">/{board.students.length}</span>
                </p>
              </div>
              <p className="text-right text-xs text-muted">
                Papan bersama
                <br />
                {updatedLabel ? `diperbarui ${updatedLabel}` : "menyambungkan"}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-1" aria-hidden="true">
              {board.students.map((student) => {
                const row = recordByStudent.get(student.id);
                return <span key={student.id} className={`size-2.5 rounded-full ${statusClass(row?.status ?? null)}`} />;
              })}
            </div>
            <button type="button" onClick={() => onOpen("absensi")} className="mt-4 min-h-11 w-full rounded-xl bg-primary font-semibold text-ink">
              Lihat rekap absensi
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Tugas aktif" value={String(activeCount)} hint="Belum ditandai selesai di HP ini" />
        <Stat label="Terisi hari ini" value={`${filled}`} hint={filled ? "Sudah ada di papan bersama" : "Belum ada isian bersama"} />
        <Stat label="Mapel hari ini" value={String(subjects.length)} hint={piket.length ? `${piket.length} siswa piket` : "Tidak ada piket"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-card border border-line bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-2xl font-semibold">Tugas terbaru</h3>
            <button type="button" className="text-sm font-semibold text-primary" onClick={() => onOpen("tugas")}>
              Lihat semua
            </button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">Belum ada tugas di papan kelas.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {upcoming.map((task) => (
                <li key={task.id} className="flex items-start justify-between gap-3 border-b border-line pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-sm text-muted">
                      {task.subject || "Tugas kelas"}
                      {task.due ? ` · ${formatShort(task.due)}` : ""}
                    </p>
                  </div>
                  {task.priority === "tinggi" && <span className="status-alpa rounded-full px-2 py-1 text-xs font-semibold">Penting</span>}
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className="rounded-card border border-line bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-2xl font-semibold">Hari ini</h3>
            <span className="rounded-full bg-raised px-3 py-1 text-xs font-semibold">{todayName || "—"}</span>
          </div>
          {subjects.length === 0 ? (
            <p className="text-sm text-muted">Tidak ada jadwal pelajaran tercatat.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {subjects.map((subject, index) => (
                <li key={subject} className="flex items-center gap-3">
                  <span className="w-6 text-sm text-muted">{String(index + 1).padStart(2, "0")}</span>
                  <span className="font-medium">{subject}</span>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-xs font-semibold tracking-widest text-muted">PIKET</p>
            <p className="mt-1 font-medium">{piket.length ? piket.join(", ") : "Tidak ada jadwal piket."}</p>
          </div>
        </article>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="rounded-card border border-line bg-surface p-4">
      <p className="text-xs font-semibold tracking-widest text-muted">{label.toUpperCase()}</p>
      <p className="mt-2 font-display text-4xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted">{hint}</p>
    </article>
  );
}

function TasksPage({
  board,
  filter,
  setFilter,
  doneIds,
  today,
  onToggle,
}: {
  board: Board;
  filter: "semua" | "aktif" | "selesai";
  setFilter: (value: "semua" | "aktif" | "selesai") => void;
  doneIds: number[];
  today: string;
  onToggle: (id: number) => void;
}) {
  const tasks = board.tasks.filter((task) => {
    const done = doneIds.includes(task.id);
    if (filter === "aktif") return !done;
    if (filter === "selesai") return done;
    return true;
  });
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <p className="text-sm text-muted">Centang selesai hanya tersimpan di HP ini. Daftar tugasnya sama untuk semua siswa.</p>
      <div className="flex flex-wrap gap-2">
        {(["semua", "aktif", "selesai"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold ${filter === key ? "bg-primary text-ink" : "bg-surface text-muted"}`}
          >
            {key === "semua" ? "Semua" : key === "aktif" ? "Belum selesai" : "Selesai"}
          </button>
        ))}
      </div>
      {tasks.length === 0 ? (
        <Empty title="Belum ada tugas" body="Tugas yang ditambahkan admin akan muncul di sini, di setiap HP." />
      ) : (
        <ul className="flex flex-col gap-3">
          {tasks.map((task) => {
            const done = doneIds.includes(task.id);
            const overdue = Boolean(task.due && task.due < today && !done);
            return (
              <li key={task.id} className="rounded-card border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold tracking-widest text-primary">{task.subject || "TUGAS KELAS"}</p>
                  {task.priority === "tinggi" && !done && <span className="status-alpa rounded-full px-2 py-1 text-xs font-semibold">PENTING</span>}
                </div>
                <h3 className="mt-1 text-lg font-semibold">{task.title}</h3>
                {task.description && <p className="mt-1 text-sm text-muted">{task.description}</p>}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className={`text-sm ${overdue ? "text-alpa" : "text-muted"}`}>
                    {task.due ? `${overdue ? "Terlambat · " : "Deadline · "}${formatShort(task.due)}` : "Tanpa deadline"}
                  </p>
                  <button
                    type="button"
                    onClick={() => onToggle(task.id)}
                    className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${done ? "bg-primary text-ink" : "border border-line"}`}
                  >
                    {done ? "Selesai" : "Tandai selesai"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AttendancePage({
  board,
  day,
  setDay,
  token,
  nameQuery,
  setNameQuery,
  onPing,
  onGuarded,
  ask,
  goAdmin,
}: {
  board: Board;
  day: string;
  setDay: (day: string) => void;
  token: string | null;
  nameQuery: string;
  setNameQuery: (value: string) => void;
  onPing: (message: string) => void;
  onGuarded: (work: () => Promise<void>) => Promise<void>;
  ask: (next: { title: string; body: string; label: string; run: () => Promise<void> | void }) => void;
  goAdmin: () => void;
}) {
  const counts = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 };
  const byStudent = new Map<number, Board["attendance"][number]>();
  for (const row of board.attendance) {
    if (row.day !== day) continue;
    byStudent.set(row.studentId, row);
    counts[row.status] += 1;
  }
  const needle = nameQuery.trim().toLocaleLowerCase("id-ID");
  const students = board.students.filter((student) => !needle || nameKey(student.name).includes(needle));
  const filled = board.attendance.filter((row) => row.day === day).length;

  async function setStatus(studentId: number, status: Status | null, note: string) {
    if (!token) return;
    await onGuarded(async () => {
      await setAttendance({ data: { token, studentId, day, status, note } });
    });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="rounded-card border border-line bg-surface p-4 text-sm text-muted">
        Rekap ini satu untuk seluruh kelas. Teman yang membuka aplikasi yang sama akan melihat isian ini, bukan daftar kosong.
      </div>
      {filled === 0 && (
        <div className="rounded-card border border-line bg-rail p-4 text-sm">
          <p className="font-semibold">Hari ini belum ada absensi di papan bersama.</p>
          <p className="mt-1 text-muted">
            Isian di situs lama hanya tersimpan di browser yang mengisinya, jadi tidak ikut pindah. Admin bisa menandai ulang di sini — sekali isi, semua HP ikut — atau impor file JSON dari situs lama.
          </p>
          {!token && (
            <button type="button" onClick={goAdmin} className="mt-3 min-h-11 rounded-xl bg-primary px-4 font-semibold text-ink">
              Masuk sebagai admin
            </button>
          )}
        </div>
      )}

      <div className="sticky top-0 z-10 -mx-4 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-card md:border md:px-3">
        <div className="flex items-center gap-2">
          <button type="button" className="grid size-11 place-items-center rounded-xl border border-line" onClick={() => day && setDay(shiftDay(day, -1))} aria-label="Hari sebelumnya">
            <ChevronLeft className="size-5" />
          </button>
          <label className="min-w-0 flex-1 text-center">
            <span className="block text-xs font-semibold tracking-widest text-muted">{day ? weekdayName(day).toUpperCase() : "HARI INI"}</span>
            <input className="w-full bg-transparent text-center font-semibold outline-none" type="date" value={day} onChange={(event) => event.target.value && setDay(event.target.value)} />
          </label>
          <button type="button" className="grid size-11 place-items-center rounded-xl border border-line" onClick={() => day && setDay(shiftDay(day, 1))} aria-label="Hari berikutnya">
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Metric label="Hadir" value={counts.Hadir} tone="status-hadir" />
        <Metric label="Izin" value={counts.Izin} tone="status-izin" />
        <Metric label="Sakit" value={counts.Sakit} tone="status-sakit" />
        <Metric label="Alpa" value={counts.Alpa} tone="status-alpa" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input className="field" value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} placeholder="Cari nama siswa" />
        {token && (
          <button
            type="button"
            className="min-h-11 shrink-0 rounded-xl border border-line px-4 text-sm font-semibold"
            onClick={() =>
              ask({
                title: "Tandai semua hadir?",
                body: `Semua siswa pada ${formatShort(day)} akan ditandai Hadir. Status yang sudah beda akan diganti. Catatan yang ada tetap disimpan.`,
                label: "Tandai hadir",
                run: () =>
                  onGuarded(async () => {
                    await markDay({ data: { token, day, status: "Hadir" } });
                    onPing("Semua siswa ditandai hadir.");
                  }),
              })
            }
          >
            Semua hadir
          </button>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {students.map((student) => {
          const row = byStudent.get(student.id) ?? null;
          return (
            <li key={student.id} className="rounded-card border border-line bg-surface p-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-raised text-xs font-semibold">
                  {initials(student.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{student.name}</p>
                  <p className="truncate text-sm text-muted">{row?.note || (row ? "Tanpa catatan" : "Belum diisi")}</p>
                </div>
                {!token && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(row?.status ?? null)}`}>{row?.status ?? "Belum"}</span>}
              </div>
              {token && (
                <div className="mt-3 grid grid-cols-4 gap-1">
                  {(["Hadir", "Izin", "Sakit", "Alpa"] as const).map((status) => {
                    const on = row?.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        className={`min-h-11 rounded-lg text-xs font-semibold ${on ? `seg-on-${status.toLowerCase()}` : "bg-rail text-muted"}`}
                        onClick={() => void setStatus(student.id, on ? null : status, on ? "" : row?.note ?? "")}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              )}
              {token && row && (
                <NoteEditor
                  note={row.note}
                  onSave={(note) =>
                    onGuarded(async () => {
                      await saveNote({ data: { token, studentId: student.id, day, note } });
                    })
                  }
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NoteEditor({ note, onSave }: { note: string; onSave: (note: string) => void }) {
  const [value, setValue] = useState(note);
  useEffect(() => setValue(note), [note]);
  return (
    <input
      className="field mt-2"
      value={value}
      maxLength={160}
      placeholder="Catatan opsional, lalu ketuk di luar kotak"
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => {
        if (value.trim() !== note) onSave(value.trim());
      }}
    />
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-xl px-2 py-3 text-center ${tone}`}>
      <p className="text-xs font-semibold">{label}</p>
      <p className="font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function SchedulePage({
  tab,
  setTab,
  todayName,
}: {
  tab: "pelajaran" | "piket";
  setTab: (tab: "pelajaran" | "piket") => void;
  todayName: string;
}) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 rounded-full bg-surface p-1">
        {(["pelajaran", "piket"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`min-h-11 rounded-full text-sm font-semibold ${tab === key ? "bg-primary text-ink" : "text-muted"}`}
          >
            {key === "pelajaran" ? "Mata pelajaran" : "Jadwal piket"}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SCHOOL_DAYS.map((name) => {
          const today = name === todayName;
          const items = tab === "pelajaran" ? SUBJECTS[name] : PICKET[name];
          return (
            <article key={name} className={`rounded-card border p-4 ${today ? "border-primary bg-surface" : "border-line bg-surface"}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-semibold">{name}</h3>
                {today && <span className="text-xs font-semibold tracking-widest text-primary">HARI INI</span>}
              </div>
              <ul className="mt-3 flex flex-col gap-2">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    {tab === "piket" && (
                      <span className="grid size-8 place-items-center rounded-full bg-raised text-xs font-semibold">{initials(item)}</span>
                    )}
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function OrgPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <article className="flex items-center gap-4 rounded-card border border-line bg-surface p-5">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary font-display text-xl font-semibold text-ink">MR</span>
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary">{HOMEROOM.role.toUpperCase()}</p>
          <h3 className="font-display text-2xl font-semibold">{HOMEROOM.name}</h3>
          <p className="text-sm text-muted">{HOMEROOM.note}</p>
        </div>
      </article>
      <div className="grid gap-3 sm:grid-cols-2">
        {ORGANIZATION.map((person) => (
          <article key={`${person.role}-${person.name}`} className="rounded-card border border-line bg-surface p-4">
            <p className="text-xs font-semibold tracking-widest text-muted">{person.role.toUpperCase()}</p>
            <h3 className="mt-2 text-lg font-semibold">{person.name}</h3>
          </article>
        ))}
      </div>
    </div>
  );
}

function AdminPage({
  token,
  board,
  today,
  onPing,
  onGuarded,
  onLogin,
  ask,
}: {
  token: string | null;
  board: Board;
  today: string;
  onPing: (message: string) => void;
  onGuarded: (work: () => Promise<void>) => Promise<void>;
  onLogin: (token: string | null) => void;
  ask: (next: { title: string; body: string; label: string; run: () => Promise<void> | void }) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [studentName, setStudentName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubject, setTaskSubject] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState<"normal" | "tinggi">("normal");
  const [taskDescription, setTaskDescription] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const login = useMutation({
    mutationFn: () => loginAdmin({ data: { username: username.trim(), password } }),
    onSuccess: (result) => {
      if (!result.ok) {
        setError(result.message);
        setPassword("");
        return;
      }
      onLogin(result.token);
      setUsername("");
      setPassword("");
      setError("");
      onPing("Masuk sebagai admin. Absensi yang kamu isi akan terlihat di HP teman.");
    },
    onError: (reason) => setError(errorText(reason)),
  });

  if (!token) {
    return (
      <form
        className="mx-auto flex max-w-md flex-col gap-3 rounded-card border border-line bg-surface p-5"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          login.mutate();
        }}
      >
        <p className="text-xs font-semibold tracking-widest text-primary">PENGELOLA KELAS</p>
        <h2 className="font-display text-3xl font-semibold">Masuk admin</h2>
        <p className="text-sm text-muted">Akun yang sama dengan situs lama. Setelah masuk, absensi tersimpan untuk semua siswa.</p>
        <label className="text-sm font-medium" htmlFor="admin-user">Username</label>
        <input id="admin-user" className="field" value={username} autoComplete="username" onChange={(event) => setUsername(event.target.value)} required />
        <label className="text-sm font-medium" htmlFor="admin-pass">Password</label>
        <input id="admin-pass" className="field" type="password" value={password} autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required />
        {error && <p className="text-sm text-alpa">{error}</p>}
        <button type="submit" className="min-h-11 rounded-xl bg-primary font-semibold text-ink" disabled={login.isPending}>
          {login.isPending ? "Memeriksa…" : "Masuk ke admin"}
        </button>
      </form>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface p-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary">ADMIN AKTIF</p>
          <h2 className="font-display text-2xl font-semibold">Halo, Nazril</h2>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold"
          onClick={() =>
            void onGuarded(async () => {
              await logoutAdmin({ data: { token } });
              onLogin(null);
              onPing("Kamu sudah keluar dari panel admin.");
            })
          }
        >
          <LogOut className="size-4" />
          Keluar
        </button>
      </div>

      <form
        className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const title = taskTitle.trim();
          if (!title) return;
          void onGuarded(async () => {
            await addTask({
              data: {
                token,
                title,
                subject: taskSubject.trim(),
                due: taskDue,
                priority: taskPriority,
                description: taskDescription.trim(),
              },
            });
            setTaskTitle("");
            setTaskSubject("");
            setTaskDue("");
            setTaskPriority("normal");
            setTaskDescription("");
            onPing("Tugas masuk ke papan kelas.");
          });
        }}
      >
        <h3 className="font-display text-2xl font-semibold">Tambah tugas</h3>
        <input className="field" value={taskTitle} maxLength={100} placeholder="Nama tugas" onChange={(event) => setTaskTitle(event.target.value)} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="field" value={taskSubject} maxLength={60} placeholder="Mata pelajaran" onChange={(event) => setTaskSubject(event.target.value)} />
          <input className="field" type="date" value={taskDue} onChange={(event) => setTaskDue(event.target.value)} />
        </div>
        <select className="field" value={taskPriority} onChange={(event) => setTaskPriority(event.target.value === "tinggi" ? "tinggi" : "normal")}>
          <option value="normal">Normal</option>
          <option value="tinggi">Penting</option>
        </select>
        <textarea className="field" rows={3} maxLength={500} placeholder="Keterangan (opsional)" value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} />
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-ink">
          <Plus className="size-4" /> Tambahkan tugas
        </button>
      </form>

      <form
        className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const name = studentName.trim();
          if (!name) return;
          void onGuarded(async () => {
            const result = await addStudent({ data: { token, name } });
            setStudentName("");
            onPing(result.created ? `${name} ditambahkan ke daftar.` : `${name} sudah ada di daftar.`);
          });
        }}
      >
        <h3 className="font-display text-2xl font-semibold">Tambah siswa</h3>
        <p className="text-sm text-muted">Daftar piket sudah dimasukkan. Tambah nama kalau ada yang belum tercatat, lalu isi absensinya di menu Absensi.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className="field" value={studentName} maxLength={80} placeholder="Nama siswa" onChange={(event) => setStudentName(event.target.value)} />
          <button type="submit" className="min-h-11 rounded-xl bg-primary px-4 font-semibold text-ink">Simpan</button>
        </div>
      </form>

      <section className="rounded-card border border-line bg-surface p-5">
        <h3 className="font-display text-2xl font-semibold">Pindahkan absensi lama</h3>
        <p className="mt-1 text-sm text-muted">
          Di HP yang sudah terisi, buka situs lama, masuk admin, lalu Ekspor JSON. Impor file itu di sini. Data digabung, tidak menghapus rekap yang sudah ada.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold"
            onClick={() => {
              const names = new Map(board.students.map((student) => [student.id, student.name]));
              const backup = {
                app: "XI TKJ",
                version: 2,
                exportedAt: new Date().toISOString(),
                data: {
                  tasks: board.tasks,
                  attendance: board.attendance.map((row) => ({
                    name: names.get(row.studentId) ?? "",
                    date: row.day,
                    status: row.status,
                    note: row.note,
                  })),
                },
              };
              const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = `cadangan-xi-tkj-${today}.json`;
              anchor.click();
              URL.revokeObjectURL(url);
              onPing("File cadangan terunduh.");
            }}
          >
            <Download className="size-4" /> Ekspor JSON
          </button>
          <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Impor JSON
          </button>
          <input
            ref={fileRef}
            hidden
            type="file"
            accept="application/json,.json"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file || !token) return;
              try {
                const parsed = JSON.parse(await file.text()) as unknown;
                const payload = normalizeBackup(parsed);
                if (!payload.tasks.length && !payload.attendance.length) {
                  onPing("File tidak berisi tugas atau absensi.");
                  return;
                }
                ask({
                  title: "Impor cadangan?",
                  body: `${payload.attendance.length} absensi dan ${payload.tasks.length} tugas akan digabung ke papan bersama. Data lama di HP itu tidak dihapus dari browser itu.`,
                  label: "Impor",
                  run: () =>
                    onGuarded(async () => {
                      const result = await importBackup({ data: { token, ...payload } });
                      onPing(`Impor selesai: ${result.attendance} absensi, ${result.tasks} tugas baru.`);
                    }),
                });
              } catch {
                onPing("File tidak valid atau bukan cadangan XI TKJ.");
              }
            }}
          />
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-5">
        <h3 className="font-display text-2xl font-semibold">Tugas yang dikelola</h3>
        {board.tasks.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Belum ada tugas.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {board.tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 border-b border-line py-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{task.title}</p>
                  <p className="text-sm text-muted">{task.subject || "Tugas kelas"}{task.due ? ` · ${formatShort(task.due)}` : ""}</p>
                </div>
                <button
                  type="button"
                  className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-alpa"
                  onClick={() =>
                    ask({
                      title: "Hapus tugas ini?",
                      body: `“${task.title}” akan hilang dari papan semua siswa.`,
                      label: "Hapus",
                      run: () =>
                        onGuarded(async () => {
                          await deleteTask({ data: { token, id: task.id } });
                          onPing("Tugas dihapus.");
                        }),
                    })
                  }
                >
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-card border border-dashed border-line px-4 py-10 text-center">
      <h3 className="font-display text-2xl font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}

function normalizeBackup(parsed: unknown): {
  tasks: { title: string; subject: string; due: string; priority: "normal" | "tinggi"; description: string }[];
  attendance: { name: string; date: string; status: Status; note: string }[];
} {
  const root = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;
  const rawTasks = Array.isArray(data.tasks) ? data.tasks : [];
  const rawAttendance = Array.isArray(data.attendance) ? data.attendance : [];
  const tasks = rawTasks
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = String(row.title ?? "").trim();
      if (!title) return null;
      const due = typeof row.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.due) ? row.due : "";
      return {
        title: title.slice(0, 100),
        subject: String(row.subject ?? "").trim().slice(0, 60),
        due,
        priority: row.priority === "tinggi" ? ("tinggi" as const) : ("normal" as const),
        description: String(row.description ?? "").trim().slice(0, 500),
      };
    })
    .filter((row): row is NonNullable<typeof row> => !!row);
  const attendance = rawAttendance
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const name = String(row.name ?? "").trim();
      const date = String(row.date ?? row.day ?? "");
      const status = String(row.status ?? "");
      if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !isStatus(status)) return null;
      return {
        name: name.slice(0, 80),
        date,
        status,
        note: String(row.note ?? "").trim().slice(0, 160),
      };
    })
    .filter((row): row is NonNullable<typeof row> => !!row);
  return { tasks, attendance };
}
