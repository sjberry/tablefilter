from random import choice

person = ['Jarbo Test', 'New User', 'Nancy Drew', 'Darth Vader', 'Bob Barker', 'Jobo Morimbo', 'Uncle Roger', 'Stan Stanford', 'Jimmy Jickleburger']
category = ['Ambition', 'Improvement', 'Job Responsibility', 'Fun']
type = ['Internal', 'Customer Project', 'Whatever Else']
status = ['In Progress', 'Completed', 'Postponed'] 

file = open('output.html', 'w')

for n in range(1000):
	file.write(
"""
<tr>
	<td>%s</td>
	<td>%s</td>
	<td>%s</td>
	<td>%s</td>
</tr>
""" % (choice(person), choice(category), choice(type), choice(status)) )

file.close()