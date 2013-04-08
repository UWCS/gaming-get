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

## Packaging Wine based packages

Generally you will want to package the whole wineprefix with your package and then use the wineprefix in the startup script:
<pre>
cd /var/tmp/dcs-get/trackmania-1.25
export WINEPREFIX=/var/tmp/dcs-get/trackmania-1.25/.wine/
wine-1.4.1 /var/tmp/dcs-get/trackmania-1.25/trackmania.exe
</pre>
Doing this means that you don't use up space in the user's actual home directory and allows dlls and other files needed for the game to be put within the wineprefix

## Compiling Wine
If you want a 64-bit version of wine then just compile it as normal on one of the lab machines, however for most purposes we want a 32-bit version as it is required to run 32-bit programs (i.e. most games).
Due to DCS not having most of the 32-bit compatibility libraries installed on the machines we need to compile wine on a 32-bit machine (oldjoshua) and then package it from there.

Compilation instructions:
* ssh to oldjoshua, your DCS username/password should work on it (oldjoshua.dcs.warwick.ac.uk)
* Install dcs-get, this may involve adjusting the dcs-get script so that it works across ssh:
<pre>
if [[ ! -n "$SSH_TTY"  && ! -z "$PS1" ]]
</pre>
Should be changed to:
<pre>
if [[ ! -z "$PS1" ]]
</pre>
* Install the various 32 bit packages required to build wine (note that some of these are not actually required but they generally solve problems later on so it's easier to install them at this point):
<pre>
dcs-get install flex.32 gnutls.32 openal-soft.32 oss.32 gettext.32 mpg123.32 gmp.32 nettle.32
</pre>
* Create a directory to work in within /var/tmp/:
<pre>
cd /var/tmp/
mkdir install
</pre>
* Download and untar the version of wine you wish to install from http://sourceforge.net/projects/wine/files/Source/:
<pre>
wget http://sourceforge.net/projects/wine/files/Source/wine-1.5.27.tar.bz2/download
tar xvf wine-1.5.27.tar.bz2
</pre>
Version 1.4.1 is what is used in most places and seems to be relatively stable
* Apply Brad's patch which enables dynamic port forwarding:
<pre>
wget http://zed0.co.uk/Misc/wine-dyn-zed0.diff
patch wine-1.5.27/dlls/ws2_32/socket.c < wine-dyn.diff
</pre>
Note that this doesn't always apply cleanly and you may have to merge it manually.
This patch allows you to forward ports that wine is trying to use in your startup script:
<pre>
export PORT_UDP_6112=9002
export PORT_TCP_6112=9002
</pre>
Ports in the range 9000 - 9050 are allowed by DCS
* Apply any other patches necessary to get whatever game you're working on working
* Compile wine to the package point you expect, the package name should reflect what patcehs have been applied, i.e. if you had applied patches to make it work with Call of Duty you might call it wine-1.5.27-call-of-duty:
<pre>
cd wine-1.5.27
CPPFLAGS="-I/var/tmp/dcs-get/include/" CFLAGS="-I/var/tmp/dcs-get/include/" LDFLAGS="-L/var/tmp/dcs-get/lib/" ./configure --with-x --prefix=/var/tmp/dcs-get/wine-1.5.27 --with-openal
make -j8 #oldjoshua has 8 cores, might as well use all of them.
#At this point you probably want to go and get a drink, even with 8 cores it will take half an hour or so
make install
</pre>

# TODO
There will be more of the guide here, at the moment it's mostly a todo list with a couple of bits that I remembered at the time.

* Compiling wine
Use oldjoshua
Apply patches (will include later) including http://zed0.co.uk/Misc/wine-dyn.diff for dynamic port forwarding.
* 32-bit libs
* DOSbox game guide
* Winetricks guide
