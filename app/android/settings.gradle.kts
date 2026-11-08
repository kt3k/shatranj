// Android shell for Shatranj: shows the web build (../../dist) in a WebView
// through gawa (https://github.com/kt3k/gawa).
//
// gawa's Android library is built from source at the commit pinned in
// gradle.properties (`gawaRevision`, the same one the web and iOS builds
// use). It is cloned into .gawa/ on the first build.
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "shatranj-android"

val gawaRevision = providers.gradleProperty("gawaRevision").get()
val gawaDir = file(".gawa/$gawaRevision")
if (!gawaDir.resolve("android/gawa/build.gradle.kts").exists()) {
    fun git(vararg args: String) {
        val p = ProcessBuilder("git", *args).inheritIO().start()
        check(p.waitFor() == 0) { "git ${args.joinToString(" ")} failed" }
    }
    gawaDir.deleteRecursively()
    git("clone", "--quiet", "https://github.com/kt3k/gawa", gawaDir.path)
    git("-C", gawaDir.path, "checkout", "--quiet", gawaRevision)
}

include(":app")
include(":gawa")
project(":gawa").projectDir = gawaDir.resolve("android/gawa")
