import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { Download, LogOut, Settings } from 'lucide-react';
import { api } from '@/lib/api';
import { clearToken, getToken } from '@/lib/auth';

type Props = {
  onLogout: () => void;
};

export function SettingsMenu({ onLogout }: Props) {
  async function downloadExport() {
    const token = getToken();
    const res = await fetch(api.exportUrl(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eatlist-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function logout() {
    clearToken();
    onLogout();
  }

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink/80 shadow-sm hover:bg-ink/5"
        >
          <Settings className="h-5 w-5" />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[180px] rounded-xl border border-ink/10 bg-white p-1 shadow-lg"
        >
          <Dropdown.Item
            onSelect={downloadExport}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-ink/5"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </Dropdown.Item>
          <Dropdown.Item
            onSelect={logout}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 outline-none data-[highlighted]:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
