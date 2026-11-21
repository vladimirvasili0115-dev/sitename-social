import java.util.Properties

// The permanent signing key lives OUTSIDE the repo (C:Usersandroavetill-release.jks); its passwords are in
// C:Usersandroavetill-signing.properties, written by the owner. Without that file the release build is unsigned.
val signing = Properties().apply {
    val file = File(System.getProperty("user.home"), "ravetill-signing.properties")
    if (file.isFile) file.inputStream().use { load(it) }
}

plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
}

android {
    namespace = "com.ravetill.app"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.ravetill.app"
        minSdk = 24
        targetSdk = 36
        versionCode = 5
        versionName = "1.4"
    }

    signingConfigs {
        if (signing.getProperty("storeFile") != null) {
            create("release") {
                storeFile = file(signing.getProperty("storeFile"))
                storePassword = signing.getProperty("storePassword")
                keyAlias = signing.getProperty("keyAlias")
                keyPassword = signing.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfigs.findByName("release")?.let { signingConfig = it }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    // Notifications while the app is closed (Firebase Cloud Messaging).
    implementation(platform("com.google.firebase:firebase-bom:35.2.0"))
    implementation("com.google.firebase:firebase-messaging")
}
