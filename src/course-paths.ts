export const COURSE_PATH_TO_SKILLTREE: Record<string, string> = {
	linux: 'linux',
	devops: 'linux',
	cybersecurity: 'cybersecurity',
	'devops-engineer': 'linux',
	'cybersecurity-engineer': 'cybersecurity',
	devsecops: 'cybersecurity',
	kali: 'linux',
	rhel: 'linux',
	rhcsa: 'linux',
	'rhce-enterprise-linux': 'linux',
	lfcs: 'linux',
	shell: 'shell',
	git: 'git',
	docker: 'docker',
	kubernetes: 'kubernetes',
	cka: 'kubernetes',
	ckad: 'kubernetes',
	cks: 'kubernetes',
	ansible: 'ansible',
	'rhce-ansible': 'ansible',
	jenkins: 'jenkins',
	nmap: 'nmap',
	wireshark: 'wireshark',
	hydra: 'hydra',
	comptia: 'cybersecurity',
	database: 'database',
	mysql: 'mysql',
	postgresql: 'postgresql',
	redis: 'redis',
	mongodb: 'mongodb',
	sqlite: 'sqlite',
	python: 'python',
	go: 'go',
	java: 'java',
	c: 'c',
	cpp: 'cpp',
	'web-development': 'html',
	'data-science': 'python',
};

export function getSkilltreeIconKeyForCoursePath(pathAlias: string | undefined) {
	if (!pathAlias) {
		return undefined;
	}

	return COURSE_PATH_TO_SKILLTREE[pathAlias] ?? pathAlias;
}
