
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsPage from "../page";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock hooks
vi.mock("next-auth/react", () => ({
    useSession: () => ({ data: { user: { name: "Test User" } }, status: "authenticated" }),
}));

const mockSetSelectedSubjectId = vi.fn();
// Mock useSubject
vi.mock("@/client/contexts/SubjectContext", () => ({
    useSubject: () => ({
        selectedSubjectId: "subject-1",
        setSelectedSubjectId: mockSetSelectedSubjectId,
        subjects: [
            { id: "subject-1", name: "Tin học THPT", slug: "tin-hoc-thpt", icon: "📘", school: null },
            { id: "subject-2", name: "Toán 12", slug: "toan-12", icon: "📐", school: null },
        ],
        isLoading: false,
    }),
}));

// Mock useTheme
vi.mock("@/client/contexts/ThemeContext", () => ({
    useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

describe("SettingsPage Subject Selection", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn((url) => {
            if (url === "/api/subjects") {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        data: [
                            { id: "subject-1", name: "Tin học THPT", slug: "tin-hoc-thpt", icon: "📘", school: null },
                            { id: "subject-2", name: "Toán 12", slug: "toan-12", icon: "📐", school: null },
                        ]
                    }),
                });
            }
            if (url === "/api/settings") {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ settings: { selectedSubjectId: "subject-1" } }),
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        }) as any;
    });

    it("renders subjects correctly", async () => {
        render(<SettingsPage />);
        await waitFor(() => expect(screen.getByText("Tin học THPT")).toBeInTheDocument());
        expect(screen.getByText("Chương trình học")).toBeInTheDocument();
    });

    it("updates local state but NOT global context immediately when clicking Pinned subject, until saved", async () => {
        render(<SettingsPage />);
        await waitFor(() => expect(screen.getByText("Tin học THPT")).toBeInTheDocument());

        // The pinned subject input
        const pinnedInput = screen.getAllByRole("radio")[0];
        fireEvent.click(pinnedInput);

        // Updated Logic: Pinned subject selection now waits for Save
        expect(mockSetSelectedSubjectId).not.toHaveBeenCalledWith("subject-1");

        // Click Save
        const saveButton = screen.getByText("Lưu thay đổi");
        fireEvent.click(saveButton);

        // Now global context updates
        expect(mockSetSelectedSubjectId).toHaveBeenCalledWith("subject-1");
    });

    it("updates backend settings but NOT global context immediately when clicking non-pinned subject", async () => {
        render(<SettingsPage />);
        await waitFor(() => expect(screen.getByText("THPT")).toBeInTheDocument());

        // Assuming THPT group is expanded by default (as per code: expandedGroups["THPT"]: true)

        // Find the radio for "Toán 12"
        // Since inputs are likely hidden (sr-only), we click the label or trigger on input
        // We can query by label text
        const label = screen.getByText("Toán 12").closest("label");
        expect(label).toBeTruthy();
        if (label) fireEvent.click(label);

        // In current code, non-pinned subject calls updateSetting (local state)
        // It does NOT call setSelectedSubjectId
        expect(mockSetSelectedSubjectId).not.toHaveBeenCalledWith("subject-2");

        // Click Save
        const saveButton = screen.getByText("Lưu thay đổi");
        expect(saveButton).toBeEnabled();
        fireEvent.click(saveButton);

        expect(global.fetch).toHaveBeenCalledWith("/api/settings", expect.objectContaining({
            method: "PUT",
            body: expect.stringContaining('"selectedSubjectId":"subject-2"')
        }));
    });
});
