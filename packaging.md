# Packaging

This is designed to be a brief guide on how to package and maintain games for gaming-get.

## Initial packaging

Most of the basic packaging information is contained within http://backus.uwcs.co.uk/dcs-get/ but there are a couple of special requirements for gaming-get in the instructions below:

* Get your program running
In many cases this is either just downloading and compiling a program or copying a program and running it under wine
* Move your package into an appropriate directory under /var/tmp/dcs-get/, this should follow the following guidelines:
  * Use the full name of the game
  * Replace spaces with hyphens
  * special characters should be ommited if possible but the game's name should remain clear
  * For the package number use the game's version number, if it does not have a version number then use the current date (in the format 2013-04-17)
  * example: Heroes of Newerth version 2.6.32.2 => /var/tmp/dcs-get/heroes-of-newerth-2.6.32.2/
* Create a bin directory within your package folder
i.e. /var/tmp/dcs-get/heroes-of-newerth-2.6.32.2/bin/
* Within this directory create a shell script with the base name of your package, i.e. without the version number, if the package is called heroes-of-newerth-2.6.32.2 your script will named heroes-of-newerth
  This should **not** have an extension
  This is the file that gets run when the game is started.  It is perfectly acceptable to have other binaries in this directory but this is the one which will be started when the play button is pressed in gaming-get.
* Edit the script to start the game and perform any other necessary startup commands
  * For backwards compatibility reasons this script should **always** use the full version number whenever a package's path is used, **this is particularly true with wine**
  * A basic startup script might look like this:
  <pre>
#!/bin/bash
cd /var/tmp/dcs-get/heroes-of-newerth-2.6.32.2/ #Most programs require that you change to their directory when you run them.
./HoN.sh
  </pre>
  * A common trick is to place a symlink in the user's home directory where the settings folder should be and thus keep the settings in the package:
  <pre>
ln -s /var/tmp/dcs-get/minecraft-1.3.2/options ~/.minecraft
  </pre>
  This requires that the 'options/' directory is created in advance
* When you are done editing the script be sure to make it executable:
<pre>
chmod a+rx bin/heroes-of-newerth
</pre>
* Generate symlinks for the game using:
<pre>
cd /var/tmp/dcs-get/
dcs-get gensymlinks heroes-of-newerth-2.6.32.2
</pre>
This places links to your scripts in dcs-get's binary directory and allows the program to be started anywhere on the system
* Test that the game works by typing it's base name on the command line (it should tab complete if it's been installed correctly)
<pre>
heroes-of-newerth
</pre>
* Assuming that the game works correctly bundle it up using:
<pre>
dcs-get package heroes-of-newerth-2.6.32.2
</pre>
This creates a .tar.gz of the game in /var/tmp/dcs-get/downloaded
* Upload the package to backus using:
<pre>
dcs-get upload heroes-of-newerth-2.6.32.2
</pre>
Many games are too large to be uploaded using the above command (which only accepts files up to around 500MB), if this is the case then scp can be used:
<pre>
scp /var/tmp/dcs-get/downloaded/heroes-of-newerth-2.6.32.2.tar.gz zed0@backus.uwcs.co.uk:/var/www/dcs-get/uploads/
</pre>
You may need to get the assistance of someone with a backus account for this step
* Now the game is uploaded to backus you will need to get someone to add it to the repository listing, this will also require someone with access to backus, these are currently: argha, ruth, james, zed0, cranman.
While people with backus access should know this already, the necessary steps on backus are:
  * Moving the packages from the uploads folder to the packages folder:
  <pre>
mv /var/www/dcs-get/uploads/heroes-of-newerth-2.6.32.2 /var/www/dcs-get/packages/
  </pre>
  * Updating the packages.json file to reflect the new package:
  <pre>
"heroes-of-newerth": {
	"description": "It's HoN man.",
	"version": [
		"2.6.32.2"
	],
	"type": "game"
}
  </pre>
  Note that this file is very sensitive to invalid json and you should verify that it is correct before saving it
* You're done, refresh the list on gaming-get and check that it worked

## Updating a package
Much of the updating of a package is the same as initially packaging it, generally there are some shortcuts you can take:
* Depending on the game you may be able to patch it in place by installing the old game and running it's updater or using rsync to only download the new parts of it
* Even if the game has not changed version you should change the version number you are using by adding a hyphen and the local revision of the package to the end
i.e. 2.6.32.2 => 2.6.32.2-1
* Move the folder to the new version number:
<pre>
mv /var/tmp/dcs-get/heroes-of-newerth-2.6.32.2 /var/tmp/dcs-get/heroes-of-newerth-2.6.32.2-1
</pre>
* Update the version number at everywhere it appears in the startup script
* Remove the old symlinks to your package (which will now be broken as you've moved their target):
<pre>
cd /var/tmp/dcs-get/bin/
find -L -type l -delete
</pre>
* Generate new symlinks for your package:
<pre>
cd /var/tmp/dcs-get
dcs-get gensymlinks heroes-of-newerth-2.6.32.2-1
</pre>
* Upload the updated package to backus:
<pre>
dcs-get upload heroes-of-newerth-2.6.32.2-1
</pre>
* Move the new package to the packages folder:
<pre>
mv /var/www/dcs-get/uploads/heroes-of-newerth-2.6.32.2-1 /var/www/dcs-get/uploads/
</pre>
* Update the packages.json file on backus with the version number in the correct location:
<pre>
"heroes-of-newerth": {
	"description": "It's HoN man.",
	"version": [
		"2.6.32.2-1",
		"2.6.32.2"
	],
	"type": "game"
}
</pre>
gaming-get will use the versions prioritising them from top to bottom, if you have an unstable package that you would still like to test then use place it farther down the list so it doesn't get downloaded by default

## Common pitfalls
* Do not include wine or any other common programs in your game package, these should be packaged seperately and uploaded seperately
* Ensure that files permissions are appropriate
* Be sure not to include any of your own account details on games that require them (this sometimes requires deleting config files)
* If gaming-get is not starting go back and ensure you haven't put any syntatical errors in packages.json


# TODO
There will be more of the guide here, at the moment it's mostly a todo list with a couple of bits that I remembered at the time.

* Compiling wine
Use oldjoshua
Apply patches (will include later) including http://zed0.co.uk/Misc/wine-dyn.diff for dynamic port forwarding.
* 32-bit libs
* DOSbox game guide
* Winetricks guide
