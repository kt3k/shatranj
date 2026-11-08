plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "io.github.kt3k.shatranj"
    compileSdk = 35

    defaultConfig {
        applicationId = "io.github.kt3k.shatranj"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    // The web build, copied to assets/www (see copyWebBuild).
    sourceSets["main"].assets.srcDir(layout.buildDirectory.dir("generated/web"))

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    jvmToolchain(17)
}

// ../../dist → assets/www. Run `deno task build` at the repository root first.
val webBuild = rootDir.resolve("../../dist")
val copyWebBuild by tasks.registering(Copy::class) {
    doFirst {
        check(webBuild.resolve("index.html").exists()) {
            "No web build at $webBuild: run `deno task build` at the repository root first."
        }
    }
    from(webBuild)
    into(layout.buildDirectory.dir("generated/web/www"))
}
tasks.named("preBuild") { dependsOn(copyWebBuild) }

dependencies {
    implementation(project(":gawa"))
    implementation("androidx.activity:activity-ktx:1.9.3")
}
