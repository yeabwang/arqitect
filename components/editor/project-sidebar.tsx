"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { X, Plus, Pencil, Trash2, Check, XCircle } from "lucide-react"
import type { Project, ProjectInvitation } from "@/hooks/use-project-dialogs"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: Project[]
  sharedProjects: Project[]
  projectInvitations?: ProjectInvitation[]
  invitationActionId?: string | null
  invitationActionError?: string | null
  currentProjectId?: string
  onCreateProject: () => void
  onRenameProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
  onAcceptInvitation?: (invitation: ProjectInvitation) => void | Promise<void>
  onDenyInvitation?: (invitation: ProjectInvitation) => void | Promise<void>
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  projectInvitations = [],
  invitationActionId,
  invitationActionError,
  currentProjectId,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onAcceptInvitation,
  onDenyInvitation,
}: ProjectSidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="project-sidebar"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "fixed top-12 left-0 z-40 flex h-[calc(100vh-3rem)] w-72 flex-col border-r border-border bg-card transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">Projects</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="my-projects" className="flex h-full flex-col">
            <div className="px-3 pt-3">
              <TabsList className="w-full">
                <TabsTrigger value="my-projects" className="flex-1">
                  My Projects
                </TabsTrigger>
                <TabsTrigger value="shared" className="flex-1">
                  Shared
                  {projectInvitations.length > 0 ? (
                    <span className="ml-1 rounded-full bg-primary px-1.5 text-[0.65rem] leading-4 text-primary-foreground">
                      {projectInvitations.length}
                    </span>
                  ) : null}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="my-projects" className="flex-1 overflow-auto px-3 py-2">
              {ownedProjects.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">No projects yet</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {ownedProjects.map((project) => (
                    <li
                      key={project.id}
                      className={cn(
                        "group flex items-center justify-between rounded-lg border border-transparent px-2 py-1.5 hover:bg-muted",
                        currentProjectId === project.id &&
                          "border-primary/30 bg-primary/10"
                      )}
                    >
                      <Link
                        href={`/editor/${project.id}`}
                        onClick={onClose}
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm text-foreground",
                          currentProjectId === project.id && "text-primary"
                        )}
                      >
                        {project.name}
                      </Link>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Rename ${project.name}`}
                          onClick={() => onRenameProject(project)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Delete ${project.name}`}
                          onClick={() => onDeleteProject(project)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="shared" className="flex-1 overflow-auto px-3 py-2">
              {sharedProjects.length === 0 && projectInvitations.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">No shared projects</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {invitationActionError ? (
                    <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {invitationActionError}
                    </p>
                  ) : null}

                  {projectInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="rounded-2xl border border-primary/30 bg-primary/10 p-3"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {invitation.projectName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {invitation.inviterName ?? "Someone"} invited you to join this collaboration space.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={invitationActionId === invitation.id}
                          onClick={() => onAcceptInvitation?.(invitation)}
                        >
                          <Check />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={invitationActionId === invitation.id}
                          onClick={() => onDenyInvitation?.(invitation)}
                        >
                          <XCircle />
                          Deny
                        </Button>
                      </div>
                    </div>
                  ))}

                  <ul className="flex flex-col gap-0.5">
                    {sharedProjects.map((project) => (
                      <li
                        key={project.id}
                        className={cn(
                          "rounded-lg border border-transparent px-2 py-1.5 hover:bg-muted",
                          currentProjectId === project.id &&
                            "border-primary/30 bg-primary/10"
                        )}
                      >
                        <Link
                          href={`/editor/${project.id}`}
                          onClick={onClose}
                          className={cn(
                            "block truncate text-sm text-foreground",
                            currentProjectId === project.id && "text-primary"
                          )}
                        >
                          {project.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t border-border p-3">
          <Button className="w-full" onClick={onCreateProject}>
            <Plus />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
