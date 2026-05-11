import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LocalMemoryVault,
  approveMemoryRecord,
  createMemoryWriteDraft,
  deleteMemoryRecord,
  findMemoryRecordByText,
  restoreMemoryVault
} from "../dist/stores/memoryStore.js";

const now = "2026-05-10T23:30:00.000Z";

describe("LocalMemoryVault", () => {
  it("proposes and approves local memory before it is returned as a note", async () => {
    const vault = new LocalMemoryVault();
    const draft = vault.propose({
      id: "memory_stage_rule",
      threadId: "thread_build_blackstage",
      summary: "Blackstage memory writes require explicit approval.",
      createdAt: now
    });

    assert.equal(draft.status, "proposed");
    assert.deepEqual(await vault.listNotes("thread_build_blackstage"), []);

    vault.approve("memory_stage_rule", "2026-05-10T23:31:00.000Z");
    const notes = await vault.listNotes("thread_build_blackstage");

    assert.equal(notes.length, 1);
    assert.equal(notes[0]?.summary, "Blackstage memory writes require explicit approval.");
  });

  it("redacts sensitive-looking values from inspection payloads", async () => {
    const vault = new LocalMemoryVault();

    vault.propose({
      id: "memory_redacted",
      threadId: "thread_build_blackstage",
      summary: "Contact founder@example.com before storing 123-45-6789.",
      createdAt: now
    });
    const [record] = await vault.inspectRecords("thread_build_blackstage");

    assert.equal(record?.redactedSummary, "Contact [email] before storing [sensitive-id].");
  });

  it("deletes only approved memory records", () => {
    const draft = createMemoryWriteDraft({
      id: "memory_delete",
      threadId: "thread_build_blackstage",
      summary: "Delete me after approval.",
      createdAt: now
    });

    assert.throws(
      () => deleteMemoryRecord(draft, "2026-05-10T23:32:00.000Z"),
      /Only approved memory/
    );

    const approved = approveMemoryRecord(draft, "2026-05-10T23:31:00.000Z");
    const deleted = deleteMemoryRecord(approved, "2026-05-10T23:32:00.000Z");

    assert.equal(deleted.status, "deleted");
    assert.equal(deleted.deletedAt, "2026-05-10T23:32:00.000Z");
  });

  it("round-trips through a serializable local snapshot", async () => {
    const vault = new LocalMemoryVault();

    vault.propose({
      id: "memory_snapshot",
      threadId: "thread_build_blackstage",
      summary: "Snapshot memory stays local.",
      createdAt: now
    });
    vault.approve("memory_snapshot", "2026-05-10T23:31:00.000Z");

    const restored = restoreMemoryVault(vault.snapshot("2026-05-10T23:32:00.000Z"));
    const notes = await restored.listNotes("thread_build_blackstage");

    assert.equal(notes.length, 1);
    assert.equal(findMemoryRecordByText(restored.snapshot(now).records, "stays local")?.id, "memory_snapshot");
  });
});
